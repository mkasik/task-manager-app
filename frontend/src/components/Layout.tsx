import { Link, Outlet, useNavigate } from 'react-router-dom';
import { KanbanSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-extrabold text-lg text-slate-900">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
                            <KanbanSquare size={16} />
                        </span>
                        Flowboard
                    </Link>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                            <Avatar name={user.name} color={user.avatarColor} size={30} />
                            <span className="hidden sm:block text-sm font-semibold text-slate-700">{user.name.split(' ')[0]}</span>
                            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Sign out">
                                <LogOut size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 bg-slate-50">
                <Outlet />
            </main>
        </div>
    );
}
