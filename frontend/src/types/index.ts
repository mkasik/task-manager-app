export interface User {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
}

export interface MemberUser {
    _id: string;
    name: string;
    email: string;
    avatarColor: string;
}

export interface Member {
    user: MemberUser;
    role: 'owner' | 'member';
    addedAt: string;
}

export interface Column {
    _id: string;
    name: string;
    order: number;
    isDoneColumn: boolean;
}

export interface Project {
    _id: string;
    name: string;
    description: string;
    owner: MemberUser;
    members: Member[];
    columns: Column[];
    createdAt: string;
    updatedAt: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
    _id: string;
    project: string;
    columnId: string;
    order: number;
    title: string;
    description: string;
    assignee: MemberUser | null;
    dueDate: string | null;
    priority: Priority;
    labels: string[];
    createdBy: MemberUser;
    reminderSentAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type NotificationType = 'task_assigned' | 'deadline_reminder' | 'project_invite';

export interface Notification {
    _id: string;
    recipient: string;
    project: { _id: string; name: string } | null;
    task: { _id: string; title: string } | null;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
