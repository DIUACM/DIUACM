import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

type Attendee = {
    id: number;
    name: string;
    username: string;
    student_id: string;
    department: string;
    profile_picture: string;
    attended_at: string;
};

type AttendanceTabProps = {
    attendees: Attendee[];
};

export function AttendanceTab({ attendees }: AttendanceTabProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    if (attendees.length === 0) {
        return (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <Users className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-500" />
                <p>No attendees yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">Name</TableHead>
                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">Student ID</TableHead>
                            <TableHead className="font-medium text-slate-700 dark:text-slate-300">Department</TableHead>
                            <TableHead className="text-right font-medium text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendees.map((attendee) => (
                            <TableRow key={attendee.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                            <AvatarImage src={attendee.profile_picture} alt={attendee.name} />
                                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                {getInitials(attendee.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">{attendee.name}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">@{attendee.username}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300">{attendee.student_id || '—'}</TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300">{attendee.department || '—'}</TableCell>
                                <TableCell className="text-right text-slate-500 dark:text-slate-400">
                                    {formatTimestamp(attendee.attended_at)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
