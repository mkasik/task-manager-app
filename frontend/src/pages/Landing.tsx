import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    KanbanSquare,
    MousePointerClick,
    Users,
    CalendarClock,
    BellRing,
    Sparkles,
    ArrowRight,
    User,
    ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    {
        icon: MousePointerClick,
        title: 'Drag-and-drop boards',
        desc: 'Move tasks between columns with native, precise drag-and-drop — no clunky third-party widget.',
    },
    {
        icon: Users,
        title: 'Team collaboration',
        desc: 'Invite teammates to a project, assign tasks, and work the same board together in real time.',
    },
    {
        icon: CalendarClock,
        title: 'Deadline tracking',
        desc: 'Due dates are flagged amber when they’re close and red when they’ve passed, right on the card.',
    },
    {
        icon: BellRing,
        title: 'Email notifications',
        desc: 'Get notified the moment you’re assigned a task or a deadline is approaching.',
    },
];

const DEMO_ACCOUNTS = [
    { label: 'Log in as User', icon: User, email: 'demo@flowboard.app', password: 'DemoPass123' },
    { label: 'Log in as Admin', icon: ShieldCheck, email: 'admin@flowboard.app', password: 'AdminPass123' },
];

export default function Landing() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loadingAccount, setLoadingAccount] = useState<string | null>(null);

    async function handleDemoLogin(email: string, password: string) {
        setError('');
        setLoadingAccount(email);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
            setError(message || 'Could not log in to the demo account.');
        } finally {
            setLoadingAccount(null);
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-lg text-slate-900">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
                            <KanbanSquare size={16} />
                        </span>
                        Flowboard
                    </div>
                    {user ? (
                        <Link to="/dashboard" className="btn-primary !py-2 !px-4 text-sm">
                            Go to Dashboard <ArrowRight size={15} />
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Sign In</Link>
                            <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Get Started</Link>
                        </div>
                    )}
                </div>
            </header>

            <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1">
                    <Sparkles size={12} /> Kanban boards for teams that ship
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-5 leading-tight">
                    Plan the work.<br />Watch it move.
                </h1>
                <p className="text-slate-500 mt-4 max-w-xl mx-auto text-base sm:text-lg">
                    Flowboard is a drag-and-drop kanban app built for small teams — assign tasks, track
                    deadlines, and stay in sync without the busywork.
                </p>

                {user ? (
                    <div className="mt-8">
                        <Link to="/dashboard" className="btn-primary !px-6 !py-3 text-base inline-flex">
                            Go to Your Dashboard <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link to="/register" className="btn-primary !px-6 !py-3 text-base w-full sm:w-auto">
                                Create Free Account <ArrowRight size={17} />
                            </Link>
                            <Link to="/login" className="btn-outline !px-6 !py-3 text-base w-full sm:w-auto">
                                Sign In
                            </Link>
                        </div>

                        <div className="card max-w-md mx-auto mt-10 p-5 bg-brand-50/40 border-brand-100">
                            <p className="text-xs font-bold text-brand-700 flex items-center justify-center gap-1.5 mb-3">
                                <Sparkles size={13} /> Just browsing? Jump straight into a live demo
                            </p>
                            {error && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-3">{error}</div>}
                            <div className="flex gap-2">
                                {DEMO_ACCOUNTS.map((acc) => (
                                    <button
                                        key={acc.email}
                                        onClick={() => handleDemoLogin(acc.email, acc.password)}
                                        disabled={loadingAccount !== null}
                                        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-white border border-brand-200 text-brand-700 rounded-lg py-2.5 hover:bg-brand-100 transition disabled:opacity-50"
                                    >
                                        <acc.icon size={15} />
                                        {loadingAccount === acc.email ? 'Signing in…' : acc.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3">No sign-up needed — logs you straight into the dashboard with sample projects.</p>
                        </div>
                    </>
                )}
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {FEATURES.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="card p-5">
                            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                                <Icon size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 mt-4 text-sm">{title}</h3>
                            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span>© {new Date().getFullYear()} Flowboard</span>
                    <span>React · TypeScript · Express · MongoDB</span>
                </div>
            </footer>
        </div>
    );
}
