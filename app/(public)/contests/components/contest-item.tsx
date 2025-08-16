"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ContestType,
  type Contest,
  type Gallery,
  type Media,
  type Team,
  type User,
} from "@/db/schema";
import { format } from "date-fns";
import {
  MapPin,
  Users,
  ExternalLink,
  ChevronDown,
  Medal,
  Images,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type ContestWithRelations = Contest & {
  gallery?:
    | (Pick<Gallery, "id" | "title" | "slug"> & {
        media?: Pick<
          Media,
          "id" | "url" | "title" | "width" | "height" | "fileSize" | "mimeType"
        >[];
      })
    | null;
  teams: (Pick<Team, "id" | "name" | "rank" | "solveCount"> & {
    members: {
      id: string;
      user: Pick<User, "id" | "name" | "image">;
    }[];
  })[];
};

type ContestProps = {
  contest: ContestWithRelations;
};

const contestTypeBadges: Record<ContestType, { label: string; class: string }> =
  {
    icpc_regional: {
      label: "ICPC Regional",
      class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
    icpc_asia_west: {
      label: "ICPC Asia West",
      class:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    },
    iupc: {
      label: "IUPC",
      class:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    other: {
      label: "Other",
      class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
  };

export function Contest({ contest }: ContestProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contestDate = contest.date ? new Date(contest.date) : null;
  const contestBadge = contestTypeBadges[contest.contestType];

  const hasTeams = Array.isArray(contest.teams) && contest.teams.length > 0;
  const hasGallery = contest.gallery?.media && contest.gallery.media.length > 0;

  // Limit displayed images to 8
  const limitedMedia =
    hasGallery && contest.gallery?.media
      ? contest.gallery.media.slice(0, 8)
      : [];

  // Check if we have more images than the limit
  const hasMoreImages =
    hasGallery && contest.gallery?.media
      ? contest.gallery.media.length > 8
      : false;

  return (
    <Card className="overflow-hidden p-0 gap-0 shadow-md border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
      {/* Contest Header - Clickable to expand */}
      <CardHeader
        className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={contestBadge.class}>{contestBadge.label}</Badge>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {contestDate
                  ? format(contestDate, "MMM d, yyyy")
                  : "No date set"}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {contest.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 mr-3">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                {Array.isArray(contest.teams) ? contest.teams.length : 0} teams
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>
      </CardHeader>

      {/* Expandable Content */}
      <div
        className={`${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        } transition-all duration-500 ease-in-out overflow-hidden`}
      >
        <CardContent className="p-0">
          {/* Contest Details */}
          <div className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              {contest.location && (
                <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
                  <MapPin className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{contest.location}</p>
                  </div>
                </div>
              )}

              {contest.standingsUrl && (
                <div className="flex items-center text-slate-700 dark:text-slate-300">
                  <ExternalLink className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Standings</p>
                    <Button
                      asChild
                      variant="link"
                      className="p-0 h-auto text-blue-600 dark:text-blue-400"
                    >
                      <a
                        href={contest.standingsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View official standings
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {contest.description && (
            <>
              <Separator />
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">
                  About this contest
                </h3>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {contest.description}
                </p>
              </div>
            </>
          )}

          {/* Teams Section */}
          {hasTeams && (
            <>
              <Separator />
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Participating Teams
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {contest.teams
                    .sort((a, b) => {
                      // Sort by rank if available
                      if (a.rank !== null && b.rank !== null) {
                        return a.rank - b.rank;
                      }
                      // If one has rank and other doesn't, ranked comes first
                      if (a.rank !== null) return -1;
                      if (b.rank !== null) return 1;
                      // Fall back to name
                      return a.name.localeCompare(b.name);
                    })
                    .map((team) => (
                      <Card
                        key={team.id}
                        className="overflow-hidden p-0 gap-0 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                      >
                        <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {team.name}
                            </h4>
                            {team.rank && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30"
                              >
                                Rank: {team.rank}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {Array.isArray(team.members) &&
                              team.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-3"
                                >
                                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                                    {member.user.image ? (
                                      <Image
                                        src={member.user.image}
                                        alt={member.user.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                                        {member.user.name.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {member.user.name}
                                  </span>
                                </div>
                              ))}
                          </div>
                          {team.solveCount !== null && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                              <Medal className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {team.solveCount} problems solved
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Gallery Preview Section */}
                {hasGallery && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Event Gallery
                      </h3>
                      {hasMoreImages && contest.gallery?.id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/galleries/${contest.gallery.slug}`}>
                            <Images className="h-4 w-4 mr-2" />
                            View All Photos
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {limitedMedia.map((mediaItem) => (
                        <div
                          key={mediaItem.id}
                          className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                        >
                          <Image
                            src={mediaItem.url}
                            alt={mediaItem.title || contest.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
