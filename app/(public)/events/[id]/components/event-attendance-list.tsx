"use client";

import { EventUserAttendance, User } from "@/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type AttendeeWithUser = EventUserAttendance & {
  user: Pick<
    User,
    "id" | "name" | "username" | "image" | "department" | "studentId"
  >;
};

interface EventAttendanceListProps {
  attendees: AttendeeWithUser[];
}

export function EventAttendanceList({ attendees }: EventAttendanceListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {attendees.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
          <p>No attendees yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="text-slate-700 dark:text-slate-300 font-medium">
                  Name
                </TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300 font-medium">
                  Student ID
                </TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300 font-medium">
                  Department
                </TableHead>
                <TableHead className="text-right text-slate-700 dark:text-slate-300 font-medium">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee) => (
                <TableRow key={`${attendee.eventId}-${attendee.userId}`}>
                  <TableCell>
                    <Link
                      href={`/programmers/${attendee.user.username}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                        {attendee.user.image && (
                          <Image
                            src={attendee.user.image}
                            alt={attendee.user.name}
                            width={40}
                            height={40}
                            unoptimized
                          />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {getInitials(attendee.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {attendee.user.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          @{attendee.user.username}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">
                    {attendee.user.studentId || "—"}
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">
                    {attendee.user.department || "—"}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 dark:text-slate-400">
                    {attendee.createdAt &&
                      format(new Date(attendee.createdAt), "MMM d, h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
