export interface Auth {
    user: User;
}

export interface SharedData {
    name: string;
    auth: Auth;
    flash: {
        success?: string;
        error?: string;
        info?: string;
        warning?: string;
    };
    onlineUsersCount: number;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    avatar: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface PublicUser {
    name: string;
    username: string;
    avatar: string;
    student_id: string;
    department: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Event {
    id: number;
    title: string;
    starting_at: string;
    ending_at: string;
    participation_scope: string;
    type: string;
    attendees_count?: number;
}

export interface EventImage {
    url: string;
    preview_url: string;
    mime_type: string;
}

export interface EventDetails extends Event {
    description: string;
    event_link: string;
    open_for_attendance: boolean;
    images: EventImage[];
    attendance?: Array<PublicUser & { attended_at: string }>;
    performance?: Array<PublicUser & { solve_count: number; upsolve_count: number }>;
}

