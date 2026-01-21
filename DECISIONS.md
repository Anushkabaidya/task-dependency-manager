# Architectural Decisions

## 1. Circular Dependency Detection (DFS)
We chose **Depth-First Search (DFS)** to detect circular dependencies because it is the standard and most efficient algorithm for cycle detection in a directed graph.

*   **Logic**: When a new dependency link (A -> B) is proposed, we perform a DFS starting from B to see if we can reach A. If A is reachable, adding the link would create a cycle (A -> B -> ... -> A).
*   **Performance**: DFS is efficient ($O(V+E)$) and easily handles the typical depth of task trees.

## 2. Bi-Directional Cascading Status Updates
To ensure data integrity and automate workflow, status changes propagate in both directions:

*   **Forward Propagation (Cascading Blocks)**: If a prerequisite is blocked, its dependents cannot proceed. Therefore, blocking a task automatically blocks all tasks that depend on it.
*   **Backward Propagation (Rollbacks)**: If a completed task, which enabled a dependent task to start, is reverted to "Pending", the dependent task's prerequisites are no longer met. To maintain consistency, we automatically roll back the dependent task to "Pending" as well.
*   **Unblocking**: When a task is unblocked, we verify if its dependents can also be unblocked by checking if they have any *other* blocked dependencies.
*   **Implementation**: This logic is implemented using **Django Signals** (`post_save`), ensuring that whether changes come from the API, Admin, or Shell, the integrity rules are always enforced.
