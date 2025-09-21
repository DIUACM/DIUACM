import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Medal } from 'lucide-react';

type User = {
    id: number;
    name: string;
    username: string;
    student_id: string;
    department: string;
    profile_picture: string;
};

type PerformanceData = {
    user: User;
    solve_count: number;
    upsolve_count: number;
    participation: boolean;
    total_count: number;
};

type PerformanceTabProps = {
    performanceData: PerformanceData[];
};

export function PerformanceTab({ performanceData }: PerformanceTabProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (performanceData.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                <p>No solve statistics available yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                            <TableHead className="text-slate-700 dark:text-slate-300 font-medium">
                                Rank
                            </TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300 font-medium">
                                Participant
                            </TableHead>
                            <TableHead className="text-center text-slate-700 dark:text-slate-300 font-medium">
                                Solves
                            </TableHead>
                            <TableHead className="text-center text-slate-700 dark:text-slate-300 font-medium">
                                Upsolves
                            </TableHead>
                            <TableHead className="text-center text-slate-700 dark:text-slate-300 font-medium">
                                Total
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {performanceData.map((stat, index) => (
                            <TableRow
                                key={stat.user.id}
                                className={
                                    index < 3 ? "bg-slate-50/50 dark:bg-slate-900/20" : ""
                                }
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {index === 0 && (
                                            <Medal className="h-5 w-5 text-yellow-500" />
                                        )}
                                        {index === 1 && (
                                            <Medal className="h-5 w-5 text-slate-400" />
                                        )}
                                        {index === 2 && (
                                            <Medal className="h-5 w-5 text-amber-600" />
                                        )}
                                        {index > 2 && <span className="pl-1">#{index + 1}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                            <AvatarImage src={stat.user.profile_picture} alt={stat.user.name} />
                                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                {getInitials(stat.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {stat.user.name}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                @{stat.user.username}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                        {stat.solve_count}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant="outline"
                                        className="text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                                    >
                                        {stat.upsolve_count}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-medium text-slate-900 dark:text-white">
                                    {stat.solve_count + stat.upsolve_count}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}