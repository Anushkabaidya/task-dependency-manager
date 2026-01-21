import React, { useState } from 'react';

const TaskCard = ({ task, onDelete, onStatusChange }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDelete(task.id);
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    // Prepare warning message if there are dependents
    const hasDependents = task.dependents && task.dependents.length > 0;
    const dependentNames = hasDependents ? task.dependents.map(d => d.task__title).join(', ') : '';

    const handleStatusChange = (e) => {
        onStatusChange(task.id, e.target.value);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative">

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-white bg-opacity-95 p-4 rounded-lg flex flex-col justify-center items-center text-center z-10 border border-red-200">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Delete Task?</p>
                    {hasDependents && (
                        <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded">
                            Warning: The following tasks depend on this: <strong>{dependentNames}</strong>
                        </p>
                    )}
                    <div className="flex gap-2">
                        <button onClick={confirmDelete} className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">Confirm</button>
                        <button onClick={cancelDelete} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs hover:bg-gray-300">Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{task.title}</h3>
                <select
                    value={task.status}
                    onChange={handleStatusChange}
                    className={`text-xs font-medium border rounded px-2 py-1 outline-none cursor-pointer ${getStatusColor(task.status)}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3 mb-4 h-15">{task.description}</p>

            <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">ID: {task.id}</span>
                <button
                    onClick={handleDeleteClick}
                    className="text-red-400 hover:text-red-600 text-xs font-medium"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TaskCard;
