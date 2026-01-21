import React, { useState } from 'react';
import api from '../api/api';

const Sidebar = ({ tasks, onTaskCreated, onLinkCreated }) => {
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [link, setLink] = useState({ source: '', target: '' });

    // UI States
    const [createLoading, setCreateLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('tasks/', newTask);
            setNewTask({ title: '', description: '' });
            showMessage('success', 'Task created successfully');
            onTaskCreated();
        } catch (err) {
            console.error(err);
            showMessage('error', 'Failed to create task');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleLink = async (e) => {
        e.preventDefault();
        if (link.source === link.target) {
            showMessage('error', 'Task cannot depend on itself');
            return;
        }

        setLinkLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post(`tasks/${link.source}/dependencies/`, { depends_on_id: link.target });
            setLink({ source: '', target: '' });
            showMessage('success', 'Dependency linked successfully');
            onLinkCreated();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to link tasks';
            if (errorMsg === 'Circular dependency detected') {
                // Format path if available
                const path = err.response?.data?.path;
                showMessage('error', `Cicrcular Dependency: ${path ? path.join(' -> ') : 'Detected'}`);
            } else {
                showMessage('error', errorMsg);
            }
        } finally {
            setLinkLoading(false);
        }
    };

    return (
        <aside className="w-80 bg-gray-50 border-r border-gray-200 p-6 flex flex-col h-screen overflow-y-auto fixed left-0 top-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Task Manager</h1>

            {/* Notification Banner */}
            {message.text && (
                <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Create Task Form */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Create New Task</h2>
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Task Title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <textarea
                            placeholder="Description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={createLoading}
                        className={`w-full text-white py-2 px-4 rounded-md font-medium transition-colors ${createLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {createLoading ? 'Creating...' : 'Create Task'}
                    </button>
                </form>
            </div>

            {/* Dependency Linker */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Link Dependency</h2>
                <form onSubmit={handleLink} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Task (Dependent)</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={link.source}
                            onChange={(e) => setLink({ ...link, source: e.target.value })}
                            required
                        >
                            <option value="">Select Task...</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Depends On</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={link.target}
                            onChange={(e) => setLink({ ...link, target: e.target.value })}
                            required
                        >
                            <option value="">Select Target...</option>
                            {tasks.map(t => (
                                // simple filtering, improved via backend validation anyway
                                t.id !== parseInt(link.source) && <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={linkLoading}
                        className={`w-full text-white py-2 px-4 rounded-md font-medium transition-colors ${linkLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900'}`}
                    >
                        {linkLoading ? 'Linking...' : 'Link Tasks'}
                    </button>
                </form>
            </div>
        </aside>
    );
};

export default Sidebar;
