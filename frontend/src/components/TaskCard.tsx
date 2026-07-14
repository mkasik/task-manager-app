import type { DragEvent } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';
import Avatar from './Avatar';

const PRIORITY_STYLES: Record<Task['priority'], string> = {
    low: 'bg-slate-100 text-slate-500',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-600',
};

function dueDateInfo(dueDate: string | null): { label: string; overdue: boolean; soon: boolean } | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const overdue = diffMs < 0;
    const soon = !overdue && diffMs < 24 * 60 * 60 * 1000;
    const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { label, overdue, soon };
}

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: () => void;
    onDragStart: (e: DragEvent, taskId: string) => void;
    onCardDragOver: (e: DragEvent, index: number) => void;
    isDragging: boolean;
}

export default function TaskCard({ task, index, onClick, onDragStart, onCardDragOver, isDragging }: TaskCardProps) {
    const due = dueDateInfo(task.dueDate);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task._id)}
            onDragOver={(e) => onCardDragOver(e, index)}
            onClick={onClick}
            className={`card p-3 mb-2 cursor-pointer hover:shadow-md transition select-none ${isDragging ? 'opacity-30' : ''}`}
        >
            {task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                    {task.labels.map((l) => (
                        <span key={l} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">{l}</span>
                    ))}
                </div>
            )}
            <p className="text-sm font-semibold text-slate-800 leading-snug">{task.title}</p>

            <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                    {due && (
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${due.overdue ? 'bg-red-100 text-red-600' : due.soon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {due.overdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
                            {due.label}
                        </span>
                    )}
                </div>
                {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={22} />}
            </div>
        </div>
    );
}
