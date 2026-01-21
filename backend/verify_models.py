
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')
django.setup()

from tasks.models import Task, TaskDependency
from django.db.utils import IntegrityError

try:
    # Cleanup
    Task.objects.all().delete()

    # Create tasks
    t1 = Task.objects.create(title="T1", status="pending")
    t2 = Task.objects.create(title="T2", status="pending")

    # Create dependency
    TaskDependency.objects.create(task=t1, depends_on=t2)
    print("Created dependency T1->T2")

    # Test Unique Constraint
    try:
        TaskDependency.objects.create(task=t1, depends_on=t2)
        print("FAIL: Duplicate dependency allowed")
    except IntegrityError:
        print("PASS: Duplicate dependency blocked")

except Exception as e:
    print(f"FAIL: Unexpected error: {e}")
