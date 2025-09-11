"use client";

import { useState, useCallback, useEffect } from "react";
import { UserPlus, Calendar, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getEventAttendeesForRanklist,
  bulkAttachEventAttendeesToRanklist,
} from "../../../actions";

interface EventAttendee {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    image: string | null;
    studentId: string | null;
    department: string | null;
  };
  eventCount: number;
}

interface AddFromEventsDialogProps {
  ranklistId: number;
  onUsersAdded?: () => void;
}

export function AddFromEventsDialog({
  ranklistId,
  onUsersAdded,
}: AddFromEventsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [attaching, setAttaching] = useState(false);

  const loadAttendees = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    try {
      const response = await getEventAttendeesForRanklist(ranklistId);
      if (response.success) {
        setAttendees(response.data as EventAttendee[]);
      } else {
        toast.error(response.error || "Failed to load attendees");
      }
    } catch {
      toast.error("Failed to load attendees");
    } finally {
      setLoading(false);
    }
  }, [open, ranklistId]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const handleUserToggle = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(attendees.map((attendee) => attendee.userId)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleAttachUsers = async () => {
    if (selectedUserIds.size === 0) {
      toast.error("Please select at least one user to attach");
      return;
    }

    setAttaching(true);
    try {
      const response = await bulkAttachEventAttendeesToRanklist(
        ranklistId,
        Array.from(selectedUserIds)
      );

      if (response.success) {
        toast.success(response.message || "Users attached successfully");
        setOpen(false);
        setSelectedUserIds(new Set());
        onUsersAdded?.();
      } else {
        toast.error(response.error || "Failed to attach users");
      }
    } catch {
      toast.error("Failed to attach users");
    } finally {
      setAttaching(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const allSelected =
    attendees.length > 0 && selectedUserIds.size === attendees.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Add from Events
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users from Event Attendance
          </DialogTitle>
          <DialogDescription>
            Select users who attended events attached to this ranklist but are
            not yet added to the ranklist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading attendees...
              </div>
            </div>
          ) : attendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No attendees found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Either there are no events attached to this ranklist, or all
                attendees are already added to the ranklist.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select all ({attendees.length} users)
                  </label>
                </div>
                {selectedUserIds.size > 0 && (
                  <Badge variant="secondary">
                    {selectedUserIds.size} selected
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Events Attended</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((attendee) => (
                      <TableRow key={attendee.userId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(attendee.userId)}
                            onCheckedChange={(checked) =>
                              handleUserToggle(
                                attendee.userId,
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={attendee.user.image || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(attendee.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {attendee.user.name}
                              </p>
                              {attendee.user.username && (
                                <p className="text-xs text-muted-foreground">
                                  @{attendee.user.username}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{attendee.user.email}</span>
                        </TableCell>
                        <TableCell>
                          {attendee.user.studentId ? (
                            <Badge variant="outline" className="text-xs">
                              {attendee.user.studentId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-sm">
                            {attendee.eventCount} event
                            {attendee.eventCount !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAttachUsers}
            disabled={selectedUserIds.size === 0 || attaching}
          >
            {attaching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Attach {selectedUserIds.size} User
            {selectedUserIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
