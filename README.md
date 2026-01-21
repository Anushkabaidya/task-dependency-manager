# Task Dependency Management System

A robust full-stack application for managing tasks with complex dependencies, built with Django and React.

## Features
- **Task Management**: Create, update, and delete tasks.
- **Dependency Tracking**: Link tasks with prerequisites.
- **Cycle Detection**: Prevents circular dependencies using Depth-First Search (DFS).
- **Auto-Automation**:
  - **Cascading Blocks**: Blocking a task blocks its dependents.
  - **Auto-Start**: Completing prerequisites automatically starts dependent tasks.
  - **Rollback**: Reverting a task status reverts its dependents.
- **Visualizer**: Real-time SVG graph of the dependency tree.

## How to Run

### Backend (Django)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000/`.

### Frontend (React)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.
