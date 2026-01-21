
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from tasks.models import Task, TaskDependency
from tasks.views import TaskViewSet

# Reset Data
Task.objects.all().delete()

# Create Tasks
t1 = Task.objects.create(title="T1")
t2 = Task.objects.create(title="T2")
t3 = Task.objects.create(title="T3")

print(f"Created tasks: T1({t1.id}), T2({t2.id}), T3({t3.id})")

factory = APIRequestFactory()
view = TaskViewSet.as_view({'post': 'dependencies'})

def add_dependency(source, target_id):
    request = factory.post(f'/api/tasks/{source.id}/dependencies/', {'depends_on_id': target_id}, format='json')
    response = view(request, pk=source.id)
    return response

# 1. T1 -> T2 (Valid)
print("\n--- Test 1: Add T1 -> T2 (Valid) ---")
resp = add_dependency(t1, t2.id)
print(f"Status: {resp.status_code}")
if resp.status_code == 201:
    print("PASS: Dependency created")
else:
    print(f"FAIL: {resp.data}")

# 2. T2 -> T3 (Valid)
print("\n--- Test 2: Add T2 -> T3 (Valid) ---")
resp = add_dependency(t2, t3.id)
print(f"Status: {resp.status_code}")
if resp.status_code == 201:
    print("PASS: Dependency created")
else:
    print(f"FAIL: {resp.data}")

# 3. T3 -> T1 (Cycle: T3->T1->T2->T3)
print("\n--- Test 3: Add T3 -> T1 (Cycle Detected) ---")
resp = add_dependency(t3, t1.id)
print(f"Status: {resp.status_code}")
if resp.status_code == 400 and 'Circular dependency detected' in str(resp.data):
    print("PASS: Cycle blocked")
    print(f"Response: {resp.data}")
else:
    print(f"FAIL: Cycle not blocked properly. Status: {resp.status_code}, Data: {resp.data}")

# 4. Self Dependency T1 -> T1
print("\n--- Test 4: Self Dependency T1 -> T1 ---")
resp = add_dependency(t1, t1.id)
print(f"Status: {resp.status_code}")
if resp.status_code == 400 and 'Tasks cannot depend on themselves' in str(resp.data):
    print("PASS: Self-dependency blocked")
else:
    print(f"FAIL: {resp.data}")
