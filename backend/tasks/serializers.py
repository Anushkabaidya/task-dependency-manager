from rest_framework import serializers
from .models import Task, TaskDependency

class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()
    dependents = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'

    def get_dependencies(self, obj):
        # Return list of IDs that 'obj' depends on
        return obj.dependencies.values_list('depends_on_id', flat=True)

    def get_dependents(self, obj):
        # Return list of IDs/Titles of tasks that depend on 'obj'
        # obj.required_by is the reverse relation for TaskDependency.depends_on
        return obj.required_by.values('task__id', 'task__title')

    def validate(self, data):
        if 'status' in data:
            new_status = data['status']
            if new_status in ['in_progress', 'completed'] and self.instance:
                # Check prerequisites
                pending_deps = self.instance.dependencies.filter(depends_on__status__in=['pending', 'in_progress', 'blocked'])
                if pending_deps.exists():
                    titles = ", ".join([d.depends_on.title for d in pending_deps])
                    raise serializers.ValidationError(
                        f"Cannot start/complete this task. Dependencies not finished: {titles}"
                    )
        return data

class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = '__all__'
