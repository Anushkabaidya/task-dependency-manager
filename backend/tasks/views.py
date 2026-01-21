from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer


def detect_cycle(source_task_id, target_task_id):
    """
    DFS to check if adding a dependency source_task_id -> target_task_id creates a cycle.
    This effectively checks if there is an existing path from target_task_id to source_task_id.
    Returns the path [target_task_id, ..., source_task_id] if a cycle is found, else None.
    """
    stack = [(target_task_id, [target_task_id])]
    visited = set()

    while stack:
        current_id, path = stack.pop()
        
        if current_id in visited:
            continue
        visited.add(current_id)

        if current_id == source_task_id:
            return path

        # Get tasks that 'current' depends on.
        # We need to query the database here.
        # Optimization: select_related could be used effectively if we passed objects,
        # but with IDs we query.
        dependencies = TaskDependency.objects.filter(task_id=current_id)
        for dep in dependencies:
            next_task_id = dep.depends_on_id
            if next_task_id not in visited:
                stack.append((next_task_id, path + [next_task_id]))
    
    return None

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def dependencies(self, request, pk=None):
        """
        Add a dependency to a task.
        POST /api/tasks/{pk}/dependencies/
        Body: {"depends_on_id": <id>}
        """
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')

        if not depends_on_id:
            return Response({"error": "depends_on_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate depends_on_id is an integer
        try:
            depends_on_id = int(depends_on_id)
        except (ValueError, TypeError):
             return Response({"error": "depends_on_id must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if dependent task exists
        if not Task.objects.filter(pk=depends_on_id).exists():
            return Response({"error": "Dependent task not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Self-dependency check
        if task.id == depends_on_id:
            return Response({"error": "Tasks cannot depend on themselves"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Cycle Detection (DFS)
        # We want to add task -> depends_on
        # Check if there is a path from depends_on -> task
        cycle_path = detect_cycle(task.id, depends_on_id)
        if cycle_path:
            # The path found is depends_on -> ... -> task
            # The full cycle is task -> depends_on -> ... -> task
            full_cycle = [task.id] + cycle_path
            return Response({
                "error": "Circular dependency detected",
                "path": full_cycle
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Create Dependency
        try:
            depends_on_task = Task.objects.get(pk=depends_on_id)
            dependency = TaskDependency.objects.create(task=task, depends_on=depends_on_task)
            return Response(TaskDependencySerializer(dependency).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Handle unique constraint or other DB errors
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

