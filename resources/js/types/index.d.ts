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

// ********* Gallery Interface Added *********
export interface Gallery {
    title: string;
    slug: string;
    description: string | null;
    thumbnail: string | null;
    images_count: number;
}

export interface GalleryImage {
    url: string;
    thumbnail: string;
    name: string;
    mime_type: string;
}

export interface GalleryDetails extends Gallery {
    images: GalleryImage[];
}

// ********* Event Interface Added *********

export interface Event {
    id: number;
    title: string;
    starting_at: string;
    ending_at: string;
    participation_scope: string;
    type: string;
    attendees_count?: number;
}
export interface EventRankList {
    name: string;
    weight: number;
    tracker_title: string;
    tracker_slug: string;
    keyword: string;
}

export interface EventDetails extends Event {
    description: string;
    event_link: string;
    open_for_attendance: boolean;
    images: GalleryImage[];
    attendance?: Array<PublicUser & { attended_at: string }>;
    performance?: Array<PublicUser & { solve_count: number; upsolve_count: number }>;
    ranklists?: EventRankList[];
}

// ********* Blogpost Interface Added *********

export interface BlogPost {
    title: string;
    slug: string;
    excerpt: string;
    published_at: string | null;
    is_featured: boolean;
    featured_image: string | null;
    author: PublicUser;
}

export interface BlogPostDetails extends BlogPost {
    content: string;
}

// ********* Contest Interface Added *********

export interface Contest {
    id: number;
    name: string;
    contest_type: string;
    location: string | null;
    date: string | null;
    description: string | null;
    standings_url: string | null;
    teams_count?: number;
}

export interface ContestTeam {
    name: string;
    rank: number | null;
    solve_count: number | null;
    members: PublicUser[];
}
export interface ContestDetails extends Contest {
    gallery?: GalleryDetails;
    teams?: ContestTeam[];
}

// ********* Programmers Interface Added *********

export interface Programmer extends PublicUser {
    max_cf_rating: number | null;
}

export interface TrackerRankList {
    keyword: string;
    position: number;
    score: number;
    total_user_count: number;
    event_count: number;
}

export interface ProgrammerContest {
    id: number;
    name: string;
    contest_type: string;
    location: string | null;
    date: string | null;
    standings_url: string | null;
    team: ContestTeam;
}

export interface TrackerPerformance {
    slug: string;
    title: string;
    rank_lists: TrackerRankList[];
}

export interface JobExperience {
    id: number;
    company_name: string;
    position: string;
    description: string | null;
    location: string | null;
    company_website: string | null;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    duration: string;
    images: GalleryImage[];
}

export interface ProgrammerDetails extends Programmer {
    atcoder_handle: string | null;
    vjudge_handle: string | null;
    codeforces_handle: string | null;
    trackers: TrackerPerformance[];
    contests: ProgrammerContest[];
    job_experiences: JobExperience[];
}
// ********* Trackers Interface Added *********
export interface Tracker {
    title: string;
    slug: string;
    description: string | null;
}
export interface TrackerEvent {
    id: number;
    title: string;
    starting_at: string;
    strict_attendance?: boolean;
    weight?: number;
}
export interface EventStat {
    event_id: number;
    solve_count: number;
    upsolve_count: number;
    participation: boolean;
}

export interface TrackerUser extends PublicUser {
    score: number;
    position: number;
    event_stats: Record<number, EventStat | null>;
}

export interface TrackerAvailableRankList {
    keyword: string;
}

export interface TrackerRankListDetails {
    keyword: string;
    consider_strict_attendance: boolean;
    events: TrackerEvent[];
    users: TrackerUser[];
}

export interface TrackerDetails extends Tracker {
    available_rank_lists: TrackerAvailableRankList[];
    selected_rank_list: TrackerRankListDetails;
}

// ********* Internal Contest Interface Added *********
export interface InternalContest {
    id: number;
    title: string;
    slug: string;
    registration_deadline: string;
    registration_start_time: string;
    registration_fee: number;
    registration_limit: number | null;
    banner_image: string | null;
    is_registration_open: boolean;
}

export interface InternalContestDetails extends InternalContest {
    description: string;
}

export interface InternalContestRegistrationView extends InternalContest {
    form_settings: {
        student_id_rules_guide?: string;
        pickup_points?: string[];
        departments?: string[];
        sections?: string[];
        lab_teacher_names?: string[];
        tshirt_sizes?: string[];
        genders?: Array<{ value: string; label: string }>;
    };
    tshirt_size_guideline_url?: string;
}

export interface InternalContestMyRegistration {
    id: number;
    internal_contest: {
        title: string;
        slug: string;
        semester: string;
        registration_fee: number;
        registration_deadline: string;
        banner_image: string | null;
    };
    student_id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    section: string;
    lab_teacher_name: string | null;
    tshirt_size: string | null;
    gender: string;
    pickup_point: string | null;
    status: 'pending' | 'paid' | 'canceled' | 'under_review';
    is_confirmed: boolean;
    is_free: boolean;
    can_pay: boolean;
    payment: {
        status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded' | 'under_manual_review';
        amount: number;
        gateway: string;
        transaction_id: string;
        paid_at: string | null;
        mfs_transaction: {
            sender_number: string;
            receiver_number: string;
            mfs_transaction_id: string;
            mfs_type: string;
            amount: number;
        } | null;
    } | null;
    payment_history: Array<{
        id: number;
        status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded' | 'under_manual_review';
        amount: number;
        gateway: string;
        transaction_id: string;
        paid_at: string | null;
        mfs_transaction: {
            sender_number: string;
            receiver_number: string;
            mfs_transaction_id: string;
            mfs_type: string;
            amount: number;
        } | null;
    }>;
    registered_at: string;
}

// ********* Incentive Application Interface Added *********
export interface CourseInfo {
    teacher_name: string;
    teacher_initial: string;
    section: string;
    teacher_email: string;
    teacher_phone: string;
    course_name: string;
    course_code: string;
}

export interface IncentiveApplication {
    id: number;
    full_name: string;
    student_id: string;
    batch: string;
    email: string;
    current_semester: string;
    phone_number: string;
    courses: CourseInfo[];
    registered_at: string;
}
