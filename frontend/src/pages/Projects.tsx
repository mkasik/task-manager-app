import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, KanbanSquare } from 'lucide-react';
import api from '../api/client';
import type { ApiResponse, Project } from '../types';
import Avatar from '../components/Avatar';
import NewProjectModal from '../components/NewProjectModal';

export default function Projects() {
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        api.get<ApiResponse<Project[]>>('/projects').then((res) => setProjects(res.data.data));
    }, []);

    function handleCreated(project: Project) {
        setProjects((prev) => [project, ...(prev || [])]);
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Your Projects</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Boards you own or collaborate on.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Project</button>
            </div>

            {!projects ? (
                <div className="text-center py-20 text-slate-400">Loading…</div>
            ) : projects.length === 0 ? (
                <div className="card p-12 text-center">
                    <KanbanSquare size={36} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 mt-3">No projects yet — create your first board to get started.</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary mt-5 inline-flex">
                        <Plus size={16} /> New Project
                    </button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((p) => (
                        <Link key={p._id} to={`/projects/${p._id}`} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition">
                            <h2 className="font-bold text-slate-900 truncate">{p.name}</h2>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5em]">{p.description || 'No description'}</p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    {p.members.slice(0, 4).map((m) => (
                                        <div key={m.user._id} className="ring-2 ring-white rounded-full">
                                            <Avatar name={m.user.name} color={m.user.avatarColor} size={26} />
                                        </div>
                                    ))}
                                    {p.members.length > 4 && (
                                        <div className="w-[26px] h-[26px] rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                            +{p.members.length - 4}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Users size={12} /> {p.members.length}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />}
        </div>
    );
}
