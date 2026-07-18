import type { components } from './schema'

type Schemas = components['schemas']

export type User = Schemas['User']
export type Permission = Schemas['Permission']
export type UserSummary = Schemas['UserSummary']
export type AuthResponse = Schemas['AuthResponse']
export type AuthConfig = Schemas['AuthConfig']
export type HandlesMap = Schemas['HandlesMap']
export type HandleType = keyof HandlesMap

export type EventListItem = Schemas['EventListItem']
export type EventDetail = Schemas['EventDetail']
export type EventMedia = Schemas['EventMedia']
export type EventType = EventListItem['type']
export type ParticipationScope = EventListItem['participationScope']
export type Attendance = Schemas['Attendance']
export type Performance = Schemas['Performance']

export type Tracker = Schemas['Tracker']
export type TrackerDetail = Schemas['TrackerDetail']
export type RanklistSummary = Schemas['RanklistSummary']
export type RanklistStandings = Schemas['RanklistStandings']
export type RanklistStanding = Schemas['RanklistStanding']
export type RanklistEventEntry = Schemas['RanklistEventEntry']
export type RanklistUserPerformance = Schemas['RanklistUserPerformance']

export type ProgrammerListItem = Schemas['ProgrammerListItem']
export type ProgrammerDetail = Schemas['ProgrammerDetail']
export type TrackerPerformanceEntry = Schemas['TrackerPerformanceEntry']

export type PaginationMeta = Schemas['PaginationMeta']
