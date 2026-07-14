import type { DragEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Column as ColumnType, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
    column: ColumnType;
    tasks: Task[];
    draggedTaskId: string | null;
    isDropTarget: boolean;
    onTaskClick: (task: Task) => void;
    onAddTask: (columnId: string) => void;
    onDragStart: (e: DragEvent, taskId: string, columnId: string) => void;
    onCardDragOver: (e: DragEvent, columnId: string, index: number) => void;
    onColumnDragOver: (e: DragEvent, columnId: string, fallbackIndex: number) => void;
    onDrop: (e: DragEvent, columnId: string) => void;
}

export default function Column({
    column,
    tasks,
    draggedTaskId,
    isDropTarget,
    onTaskClick,
    onAddTask,
    onDragStart,
    onCardDragOver,
    onColumnDragOver,
    onDrop,
}: ColumnProps) {
    return (
        <div
            className={`flex-shrink-0 w-72 rounded-xl p-2.5 flex flex-col max-h-full ${isDropTarget ? 'bg-brand-50' : 'bg-slate-100/70'}`}
            onDragOver={(e) => onColumnDragOver(e, column._id, tasks.length)}
            onDrop={(e) => onDrop(e, column._id)}
        >
            <div className="flex items-center justify-between px-1.5 py-1 mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">{column.name}</span>
                    <span className="text-xs font-semibold text-slate-400 bg-white rounded-full px-1.5 py-0.5">{tasks.length}</span>
                </div>
                <button onClick={() => onAddTask(column._id)} className="p-1 rounded-md text-slate-400 hover:bg-white hover:text-brand-600" title="Add task">
                    <Plus size={15} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 px-0.5 min-h-[40px]">
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task._id}
                        task={task}
                        index={index}
                        isDragging={draggedTaskId === task._id}
                        onClick={() => onTaskClick(task)}
                        onDragStart={(e, taskId) => onDragStart(e, taskId, column._id)}
                        onCardDragOver={(e, index) => onCardDragOver(e, column._id, index)}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-lg">Drop a task here</div>
                )}
            </div>
        </div>
    );
}
