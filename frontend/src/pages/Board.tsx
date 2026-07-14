import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus } from 'lucide-react';
import axios from 'axios';
import api from '../api/client';
import type { ApiResponse, Project, Task } from '../types';
import Column from '../components/Column';
import TaskModal from '../components/TaskModal';
import AddMemberModal from '../components/AddMemberModal';
import Avatar from '../components/Avatar';

export default function Board() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [taskModal, setTaskModal] = useState<{ task: Task | null; columnId: string } | null>(null);
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [addingColumn, setAddingColumn] = useState(false);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const loadBoard = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setLoadError('');
        try {
            const [projectRes, tasksRes] = await Promise.all([
                api.get<ApiResponse<Project>>(`/projects/${id}`),
                api.get<ApiResponse<Task[]>>(`/projects/${id}/tasks`),
            ]);
            setProject(projectRes.data.data);
            setTasks(tasksRes.data.data);
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setLoadError(message || 'Could not load this board.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadBoard();
    }, [loadBoard]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading board…</div>;
    }

    if (loadError || !project) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-semibold">{loadError || 'Board not found.'}</p>
                <Link to="/" className="text-brand-600 font-semibold text-sm mt-3 inline-block">&larr; Back to Projects</Link>
            </div>
        );
    }

    const sortedColumns = [...project.columns].sort((a, b) => a.order - b.order);

    function tasksForColumn(columnId: string) {
        return tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order);
    }

    function handleDragStart(e: DragEvent, taskId: string) {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleCardDragOver(e: DragEvent, columnId: string, index: number) {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;
        setDragOverColumnId(columnId);
        setDragOverIndex(isAfter ? index + 1 : index);
    }

    function handleColumnDragOver(e: DragEvent, columnId: string, fallbackIndex: number) {
        e.preventDefault();
        setDragOverColumnId(columnId);
        setDragOverIndex((prev) => (dragOverColumnId === columnId && prev !== null ? prev : fallbackIndex));
    }

    async function handleDrop(e: DragEvent, columnId: string) {
        e.preventDefault();
        const taskId = draggedTaskId;
        const toIndex = dragOverIndex ?? tasksForColumn(columnId).length;
        setDraggedTaskId(null);
        setDragOverColumnId(null);
        setDragOverIndex(null);
        if (!taskId) return;

        const task = tasks.find((t) => t._id === taskId);
        if (!task) return;

        // Optimistic local reorder
        setTasks((prev) => {
            const withoutMoved = prev.filter((t) => t._id !== taskId);
            const targetSiblings = withoutMoved.filter((t) => t.columnId === columnId);
            const others = withoutMoved.filter((t) => t.columnId !== columnId);
            targetSiblings.splice(Math.min(toIndex, targetSiblings.length), 0, { ...task, columnId });
            const reindexed = targetSiblings.map((t, i) => ({ ...t, order: i }));
            return [...others, ...reindexed];
        });

        try {
            const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/move`, { toColumnId: columnId, toIndex });
            setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
        } catch {
            loadBoard(); // reconcile with server state if the optimistic move failed
        }
    }

    function handleTaskSaved(task: Task) {
        setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev.map((t) => (t._id === task._id ? task : t)) : [...prev, task]));
    }

    function handleTaskDeleted(taskId: string) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
    }

    async function handleAddColumn() {
        if (!newColumnName.trim() || !project) return;
        const res = await api.post<ApiResponse<Project['columns']>>(`/projects/${project._id}/columns`, { name: newColumnName.trim() });
        setProject({ ...project, columns: res.data.data });
        setNewColumnName('');
        setAddingColumn(false);
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 bg-white">
                <div className="min-w-0">
                    <Link to="/" className="text-xs text-brand-600 font-semibold flex items-center gap-1 mb-1"><ArrowLeft size={12} /> All Projects</Link>
                    <h1 className="text-lg font-extrabold text-slate-900 truncate">{project.name}</h1>
                </div>
                <button onClick={() => setMemberModalOpen(true)} className="btn-outline">
                    <div className="flex -space-x-2 mr-1">
                        {project.members.slice(0, 3).map((m) => (
                            <div key={m.user._id} className="ring-2 ring-white rounded-full">
                                <Avatar name={m.user.name} color={m.user.avatarColor} size={22} />
                            </div>
                        ))}
                    </div>
                    <Users size={14} /> {project.members.length}
                </button>
            </div>

            <div className="flex-1 overflow-x-auto px-4 sm:px-6 py-4">
                <div className="flex gap-4 h-full">
                    {sortedColumns.map((column) => (
                        <Column
                            key={column._id}
                            column={column}
                            tasks={tasksForColumn(column._id)}
                            draggedTaskId={draggedTaskId}
                            isDropTarget={dragOverColumnId === column._id}
                            onTaskClick={(task) => setTaskModal({ task, columnId: task.columnId })}
                            onAddTask={(columnId) => setTaskModal({ task: null, columnId })}
                            onDragStart={handleDragStart}
                            onCardDragOver={handleCardDragOver}
                            onColumnDragOver={handleColumnDragOver}
                            onDrop={handleDrop}
                        />
                    ))}

                    <div className="flex-shrink-0 w-64">
                        {addingColumn ? (
                            <div className="card p-3">
                                <input
                                    autoFocus
                                    className="input-field text-sm"
                                    placeholder="Column name"
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleAddColumn} className="btn-primary !py-1.5 text-xs flex-1">Add</button>
                                    <button onClick={() => setAddingColumn(false)} className="btn-outline !py-1.5 text-xs flex-1">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingColumn(true)}
                                className="w-full h-11 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-500 flex items-center justify-center gap-1.5 text-sm font-semibold"
                            >
                                <Plus size={15} /> Add Column
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {taskModal && (
                <TaskModal
                    project={project}
                    task={taskModal.task}
                    columnId={taskModal.columnId}
                    onClose={() => setTaskModal(null)}
                    onSaved={handleTaskSaved}
                    onDeleted={handleTaskDeleted}
                />
            )}

            {memberModalOpen && (
                <AddMemberModal
                    project={project}
                    onClose={() => setMemberModalOpen(false)}
                    onUpdated={(p) => setProject(p)}
                />
            )}
        </div>
    );
}
