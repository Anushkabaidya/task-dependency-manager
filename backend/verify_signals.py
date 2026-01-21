
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'task_manager.settings')
django.setup()

from tasks.models import Task, TaskDependency

def reset_data():
    Task.objects.all().delete()

print("--- Test 1: Blocking Logic (Cascade) ---")
reset_data()
tA = Task.objects.create(title="A", status="pending")
tB = Task.objects.create(title="B", status="pending")
tC = Task.objects.create(title="C", status="pending")
# A -> B -> C
TaskDependency.objects.create(task=tA, depends_on=tB)
TaskDependency.objects.create(task=tB, depends_on=tC)

print(f"Initial: A:{tA.status}, B:{tB.status}, C:{tC.status}")
# Block C
print("Blocking C...")
tC.status = 'blocked'
tC.save()

tA.refresh_from_db()
tB.refresh_from_db()
print(f"Result: A:{tA.status}, B:{tB.status}")

if tA.status == 'blocked' and tB.status == 'blocked':
    print("PASS: Blocking cascaded")
else:
    print("FAIL: Blocking did not cascade")

print("\n--- Test 2: Completion Logic (Pending -> In Progress) ---")
reset_data()
tA = Task.objects.create(title="A", status="pending")
tB = Task.objects.create(title="B", status="pending")
# A -> B
TaskDependency.objects.create(task=tA, depends_on=tB)

# Complete B
print("Completing B...")
tB.status = 'completed'
tB.save()

tA.refresh_from_db()
print(f"Result: A:{tA.status}")

if tA.status == 'in_progress':
    print("PASS: Task A moved to in_progress")
else:
    print("FAIL: Task A did not update")

print("\n--- Test 3: New Dependency Logic (In Progress -> Pending) ---")
reset_data()
tA = Task.objects.create(title="A", status="in_progress")
tB = Task.objects.create(title="B", status="pending")

# Add dependency A -> B
print("Adding dependency A->B...")
TaskDependency.objects.create(task=tA, depends_on=tB)

tA.refresh_from_db()
print(f"Result: A:{tA.status}")

if tA.status == 'pending':
    print("PASS: Task A reverted to pending")
else:
    print("FAIL: Task A did not revert")

print("\n--- Test 4: New Dependency (Blocked) ---")
reset_data()
tA = Task.objects.create(title="A", status="pending")
tB = Task.objects.create(title="B", status="blocked")

print("Adding dependency A->B (blocked)...")
TaskDependency.objects.create(task=tA, depends_on=tB)

tA.refresh_from_db()
print(f"Result: A:{tA.status}")

if tA.status == 'blocked':
    print("PASS: Task A became blocked")
else:
    print("FAIL: Task A did not block")

print("\n--- Test 5: Completion Logic (Mixed dependencies) ---")
reset_data()
tA = Task.objects.create(title="A", status="pending")
tB = Task.objects.create(title="B", status="completed")
tC = Task.objects.create(title="C", status="pending")
# A -> B (done), A -> C (pending)
TaskDependency.objects.create(task=tA, depends_on=tB)
TaskDependency.objects.create(task=tA, depends_on=tC)

print("Completing C...")
tC.status = 'completed'
tC.save()

tA.refresh_from_db()
print(f"Result: A:{tA.status}")

if tA.status == 'in_progress':
    print("PASS: Task A moved to in_progress")
else:
    print("FAIL: Task A did not update")
