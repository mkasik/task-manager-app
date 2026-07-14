import { useState, type FormEvent } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import axios from 'axios';
import api from '../api/client';
import type { ApiResponse, Project } from '../types';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function AddMemberModal({ project, onClose, onUpdated }: { project: Project; onClose: () => void; onUpdated: (p: Project) => void }) {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const isOwner = project.owner._id === user?.id;

    async function handleAdd(e: FormEvent) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const res = await api.post<ApiResponse<Project>>(`/projects/${project._id}/members`, { email });
            onUpdated(res.data.data);
            setEmail('');
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Could not add member.');
        } finally {
            setBusy(false);
        }
    }

    async function handleRemove(userId: string) {
        if (!confirm('Remove this member from the project?')) return;
        const res = await api.delete<ApiResponse<Project>>(`/projects/${project._id}/members/${userId}`);
        onUpdated(res.data.data);
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">Team Members</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-1">
                    {project.members.map((m) => (
                        <div key={m.user._id} className="flex items-center gap-3 py-2">
                            <Avatar name={m.user.name} color={m.user.avatarColor} size={32} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{m.user.name}</p>
                                <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{m.role}</span>
                            {isOwner && m.role !== 'owner' && (
                                <button onClick={() => handleRemove(m.user._id)} className="p-1.5 text-slate-400 hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {isOwner && (
                    <form onSubmit={handleAdd} className="p-5 border-t border-slate-100">
                        {error && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3">{error}</div>}
                        <label className="text-sm font-semibold text-slate-700">Add member by email</label>
                        <div className="flex gap-2 mt-1">
                            <input type="email" required placeholder="teammate@example.com" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <button type="submit" disabled={busy} className="btn-primary !px-3.5"><UserPlus size={16} /></button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">They need an existing Flowboard account.</p>
                    </form>
                )}
            </div>
        </div>
    );
}
