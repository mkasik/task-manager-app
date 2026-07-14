import { useState, type FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import axios from 'axios';
import api from '../api/client';
import type { ApiResponse, Priority, Project, Task } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
    project: Project;
    task: Task | null; // null = creating a new task
    columnId: string;
    onClose: () => void;
    onSaved: (task: Task) => void;
    onDeleted: (taskId: string) => void;
}

function toDateInputValue(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10);
}

export default function TaskModal({ project, task, columnId, onClose, onSaved, onDeleted }: TaskModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [assignee, setAssignee] = useState(task?.assignee?._id || '');
    const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate || null));
    const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
    const [labels, setLabels] = useState(task?.labels.join(', ') || '');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const canDelete = !!task && (task.createdBy._id === user?.id || project.owner._id === user?.id);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setBusy(true);

        const payload = {
            title,
            description,
            assignee: assignee || null,
            dueDate: dueDate || null,
            priority,
            labels: labels.split(',').map((l) => l.trim()).filter(Boolean),
        };

        try {
            if (task) {
                const res = await api.put<ApiResponse<Task>>(`/tasks/${task._id}`, payload);
                onSaved(res.data.data);
            } else {
                const res = await api.post<ApiResponse<Task>>(`/projects/${project._id}/tasks`, { ...payload, columnId });
                onSaved(res.data.data);
            }
            onClose();
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Could not save task.');
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (!task || !confirm('Delete this task?')) return;
        await api.delete(`/tasks/${task._id}`);
        onDeleted(task._id);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    {error && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">{error}</div>}

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Title</label>
                        <input required autoFocus className="input-field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <textarea className="input-field mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Assignee</label>
                            <select className="input-field mt-1" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                                <option value="">Unassigned</option>
                                {project.members.map((m) => (
                                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Priority</label>
                            <select className="input-field mt-1" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Due Date</label>
                        <input type="date" className="input-field mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Labels <span className="text-slate-400 font-normal">(comma separated)</span></label>
                        <input className="input-field mt-1" placeholder="frontend, urgent" value={labels} onChange={(e) => setLabels(e.target.value)} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {canDelete ? (
                            <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-500 flex items-center gap-1.5 hover:text-red-600">
                                <Trash2 size={14} /> Delete
                            </button>
                        ) : <span />}
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save Task'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
