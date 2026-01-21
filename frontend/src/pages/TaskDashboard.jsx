import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import DependencyVisualizer from '../components/DependencyVisualizer';

const TaskDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('tasks/');
            setTasks(response.data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setError('Failed to load tasks. Please ensure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    // Silent refresh for updates
    const refreshTasks = async () => {
        try {
            const response = await api.get('tasks/');
            setTasks(response.data);
        } catch (error) {
            console.error('refresh error', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await api.delete(`tasks/${taskId}/`);
            refreshTasks();
        } catch (error) {
            alert('Failed to delete task: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            await api.patch(`tasks/${taskId}/`, { status: newStatus });
            refreshTasks();
        } catch (error) {
            alert('Failed to update status: ' + (error.response?.data?.error || error.message));
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar
                tasks={tasks}
                onTaskCreated={refreshTasks}
                onLinkCreated={refreshTasks}
            />
            <main className="ml-80 flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <span className="text-sm text-gray-500">{tasks.length} Tasks</span>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Dependency Graph */}
                {!loading && !error && tasks.length > 0 && (
                    <DependencyVisualizer tasks={tasks} />
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : !error && tasks.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
                        <p className="text-gray-500 mt-1">Create your first task in the sidebar to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleUpdateStatus}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskDashboard;
