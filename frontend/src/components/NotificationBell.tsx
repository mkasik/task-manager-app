import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, UserPlus, Clock, ClipboardList } from 'lucide-react';
import api from '../api/client';
import type { ApiResponse, Notification, NotificationType } from '../types';

const ICONS: Record<NotificationType, typeof Bell> = {
    task_assigned: ClipboardList,
    deadline_reminder: Clock,
    project_invite: UserPlus,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    const load = useCallback(() => {
        api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications').then((res) => {
            setNotifications(res.data.data.notifications);
            setUnreadCount(res.data.data.unreadCount);
        });
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [load]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleMarkAllRead() {
        await api.put('/notifications/read-all');
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    }

    async function handleOpenNotification(n: Notification) {
        if (!n.read) {
            await api.put(`/notifications/${n._id}/read`);
            setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
            setUnreadCount((c) => Math.max(0, c - 1));
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-slate-100">
                <Bell size={19} className="text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 card z-50 max-h-[70vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                                <CheckCheck size={13} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-8">No notifications yet.</p>
                        ) : (
                            notifications.map((n) => {
                                const Icon = ICONS[n.type];
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleOpenNotification(n)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                                            <Icon size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
