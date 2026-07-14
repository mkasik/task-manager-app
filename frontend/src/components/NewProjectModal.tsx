import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import api from '../api/client';
import type { ApiResponse, Project } from '../types';

export default function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const res = await api.post<ApiResponse<Project>>('/projects', { name, description });
            onCreated(res.data.data);
            onClose();
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Could not create project.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">New Project</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    {error && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">{error}</div>}
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Project Name</label>
                        <input required autoFocus className="input-field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Description (optional)</label>
                        <textarea className="input-field mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <p className="text-xs text-slate-400">Starts with four columns: To Do, In Progress, Review, Done — customize anytime.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
