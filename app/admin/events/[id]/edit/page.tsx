import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getEvent } from "../../actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

import { EventForm } from "../../components/event-form";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit Event | DIU ACM Admin",
  description: "Edit event details",
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const { data: event, error } = await getEvent(eventId);

  if (error || !event) {
    notFound();
  }

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
                <Link href="/admin/events">Events</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-foreground font-medium">
                Edit Event
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Event: {event.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modify event details and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/events/${eventId}/attendees`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Attendees
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <EventForm initialData={event} isEditing eventId={eventId} />
    </div>
  );
}
