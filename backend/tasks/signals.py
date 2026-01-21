from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Task, TaskDependency

@receiver(pre_save, sender=Task)
def track_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Task.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Task)
def task_status_changed(sender, instance, created, **kwargs):
    if created:
        return

    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    # 1. Blocking Logic: If instance is blocked, block dependent tasks
    if new_status == 'blocked':
        dependent_tasks = Task.objects.filter(dependencies__depends_on=instance).exclude(status='blocked')
        for task in dependent_tasks:
            task.status = 'blocked'
            task.save()

    # 2. Completion Logic: If instance is completed, check dependent tasks
    elif new_status == 'completed':
        dependent_tasks = Task.objects.filter(dependencies__depends_on=instance)
        for task in dependent_tasks:
            if task.status == 'completed':
                continue
            
            unfinished_deps = task.dependencies.filter(depends_on__status__in=['pending', 'in_progress', 'blocked'])
            if not unfinished_deps.exists():
                if task.status != 'in_progress':
                    task.status = 'in_progress'
                    task.save()

    # 3. Rollback Logic: Completed -> Pending/In Progress
    # If a task was completed and is now NOT completed, dependent tasks must revert
    if old_status == 'completed' and new_status != 'completed':
        dependent_tasks = Task.objects.filter(dependencies__depends_on=instance, status__in=['in_progress', 'completed'])
        for task in dependent_tasks:
            task.status = 'pending'
            task.save()

    # 4. Unblocking Logic: Blocked -> Pending/In Progress
    # If a task was blocked and is now unblocked, check if dependents can be unblocked
    if old_status == 'blocked' and new_status != 'blocked':
        dependent_tasks = Task.objects.filter(dependencies__depends_on=instance, status='blocked')
        for task in dependent_tasks:
            # Check if this task has ANY OTHER blocked dependencies
            other_blocked_deps = task.dependencies.filter(depends_on__status='blocked').exclude(depends_on=instance)
            if not other_blocked_deps.exists():
                task.status = 'pending'
                task.save()

@receiver(post_save, sender=TaskDependency)
def dependency_added(sender, instance, created, **kwargs):
    if created:
        task = instance.task
        depends_on = instance.depends_on
        
        # 3. Initial State: If new dependency is added...
        if task.status == 'in_progress':
            # ...and the new dependency is NOT finished
            if depends_on.status != 'completed':
                # Move back to pending
                task.status = 'pending'
                task.save()
        
        # 4. Immediate Blocking: If new dependency is blocked, block this task
        if depends_on.status == 'blocked' and task.status != 'blocked':
            task.status = 'blocked'
            task.save()
