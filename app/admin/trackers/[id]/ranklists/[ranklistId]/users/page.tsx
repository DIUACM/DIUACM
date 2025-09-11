import Link from "next/link";
import { Users, Trophy, Trash2, ArrowLeft, UserCheck } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTracker } from "../../../../actions";
import {
  getRanklist,
  getAttachedUsers,
  detachUserFromRanklist,
} from "../../actions";
import { AttachUserDialog } from "./components/add-user-dialog";
import { AddFromEventsDialog } from "./components/add-from-events-dialog";
import { EditScoreDialog } from "./components/edit-score-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserSearchResult } from "@/components/user-search-dialog";

interface UsersPageProps {
  params: Promise<{ id: string; ranklistId: string }>;
}

interface AttachedUser {
  userId: string;
  score: number;
  user: UserSearchResult;
}

export async function generateMetadata({
  params,
}: UsersPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const trackerId = parseInt(resolvedParams.id);
  const ranklistId = parseInt(resolvedParams.ranklistId);

  if (isNaN(trackerId) || isNaN(ranklistId)) {
    return { title: "Ranklist Users | DIU ACM Admin" };
  }

  const [{ data: tracker }, { data: ranklist }] = await Promise.all([
    getTracker(trackerId),
    getRanklist(ranklistId, trackerId),
  ]);

  return {
    title: `${
      (ranklist as { keyword?: string })?.keyword || "Ranklist"
    } Users - ${
      (tracker as { title?: string })?.title || "Tracker"
    } | DIU ACM Admin`,
    description: `Manage users for ranklist ${
      (ranklist as { keyword?: string })?.keyword || "ranklist"
    }`,
  };
}

async function DetachUserButton({
  ranklistId,
  userId,
  userName,
}: {
  ranklistId: number;
  userId: string;
  userName: string;
}) {
  const handleDetach = async () => {
    "use server";
    const response = await detachUserFromRanklist(ranklistId, userId);
    if (!response.success) {
      throw new Error(response.error || "Failed to detach user");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Detach User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to detach &quot;{userName}&quot; from this
            ranklist? This will remove their score and all data. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDetach}
          >
            Detach User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default async function UsersPage({ params }: UsersPageProps) {
  const resolvedParams = await params;
  const trackerId = parseInt(resolvedParams.id);
  const ranklistId = parseInt(resolvedParams.ranklistId);

  if (isNaN(trackerId) || isNaN(ranklistId)) {
    notFound();
  }

  const [trackerResponse, ranklistResponse, usersResponse] = await Promise.all([
    getTracker(trackerId),
    getRanklist(ranklistId, trackerId),
    getAttachedUsers(ranklistId),
  ]);

  const tracker = trackerResponse.data;
  const ranklist = ranklistResponse.data;
  const { data: usersData } = usersResponse;

  if (!tracker || !ranklist) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackerData = tracker as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ranklistData = ranklist as any;
  const users = (usersData as AttachedUser[]) || [];

  // Sort users by score (descending)
  const sortedUsers = [...users].sort((a, b) => b.score - a.score);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/trackers">Trackers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/admin/trackers/${trackerId}/edit`}>
                  {trackerData.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/admin/trackers/${trackerId}/ranklists`}>
                  Ranklists
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/admin/trackers/${trackerId}/ranklists/${ranklistId}/edit`}
                >
                  {ranklistData.keyword}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-foreground font-medium">
                Users
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Users for {ranklistData.keyword}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user attachments and scores for this ranklist
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link
                href={`/admin/trackers/${trackerId}/ranklists/${ranklistId}/edit`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ranklist
              </Link>
            </Button>
            <AddFromEventsDialog ranklistId={ranklistId} />
            <AttachUserDialog ranklistId={ranklistId} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Attached Users
                </div>
              </CardTitle>
              <CardDescription>
                {users.length > 0
                  ? `${users.length} user${
                      users.length !== 1 ? "s" : ""
                    } attached to this ranklist`
                  : "No users attached"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-muted/50 w-20 h-20 mx-auto flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No users attached
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Start by attaching users to this ranklist to track their
                progress and scores.
              </p>
              <div className="flex items-center justify-center gap-2">
                <AddFromEventsDialog ranklistId={ranklistId} />
                <AttachUserDialog ranklistId={ranklistId} />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((item, index) => (
                  <TableRow key={item.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className={`${
                              index === 0
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : index === 1
                                ? "bg-gray-400 hover:bg-gray-500"
                                : "bg-amber-600 hover:bg-amber-700"
                            } text-white`}
                          >
                            <Trophy className="w-3 h-3 mr-1" />#{index + 1}
                          </Badge>
                        ) : (
                          <Badge variant="outline">#{index + 1}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.user.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(item.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.user.name}</p>
                          {item.user.username && (
                            <p className="text-xs text-muted-foreground">
                              @{item.user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.user.email}</span>
                    </TableCell>
                    <TableCell>
                      {item.user.studentId ? (
                        <Badge variant="outline" className="text-xs">
                          {item.user.studentId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-sm font-mono">
                        {item.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditScoreDialog
                          ranklistId={ranklistId}
                          userId={item.userId}
                          userName={item.user.name}
                          currentScore={item.score}
                        />
                        <DetachUserButton
                          ranklistId={ranklistId}
                          userId={item.userId}
                          userName={item.user.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
