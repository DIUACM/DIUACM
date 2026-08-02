/**
 * Free courses assembled from DIU ACM's recorded class series on YouTube.
 *
 * These recordings are fixed — a finished semester's classes never change — so
 * they live here rather than in D1 behind an admin UI, the same way the contest
 * archive ships as static data. Adding a course is an entry in `COURSES`.
 *
 * `durationSeconds` comes from each video's `lengthSeconds`, and every lesson
 * has been checked for `playableInEmbed: true`; a video that is later made
 * private or embed-disabled would render an unplayable frame, which is what the
 * "watch the full playlist" fallback link on the course page is for.
 */

export interface Lesson {
  /** 1-based position, shown in the list and used as the `?lesson=` value. */
  number: number
  /**
   * Our label for the class. Kept close to the YouTube title but cleaned up —
   * e.g. YouTube's "Class: 06 - Funtion & Recursion" is a typo we don't repeat.
   */
  title: string
  /**
   * One line under the player. Editorial, written from the class title rather
   * than transcribed from the recording — worth a skim by whoever taught the
   * series before anyone relies on it as a syllabus.
   */
  summary: string
  youtubeId: string
  durationSeconds: number
}

export interface Course {
  slug: string
  title: string
  tagline: string
  description: string
  /** Source playlist, linked as a fallback and for people who prefer YouTube. */
  playlistId: string
  lessons: Lesson[]
}

export const COURSES: Course[] = [
  {
    slug: 'c-for-beginners',
    title: 'C for Beginners',
    tagline: 'Recorded class series — C-Khoon, Fall 2024',
    description:
      'Seven recorded classes that take you from your first C program to pointers and structures. This is the starting point before Green Sheet practice and DIU ACM’s advanced training — no prior programming experience needed.',
    playlistId: 'PLLDTjYhd-rVkzWTHBf2NTJFen-l95t_5o',
    lessons: [
      {
        number: 1,
        title: 'Introduction to C',
        summary:
          'Setting up a compiler, the anatomy of a C program, variables, data types, and reading input.',
        youtubeId: 'MSE6VlVt6as',
        durationSeconds: 4248,
      },
      {
        number: 2,
        title: 'Operators',
        summary:
          'Arithmetic, relational, logical, assignment, and bitwise operators, plus precedence and type conversion.',
        youtubeId: 'H8Mf0fcIvlU',
        durationSeconds: 5233,
      },
      {
        number: 3,
        title: 'Conditional Statements',
        summary:
          'Branching with if, else if, else, nested conditions, the ternary operator, and switch.',
        youtubeId: 'vQJ3-PSAZR4',
        durationSeconds: 4171,
      },
      {
        number: 4,
        title: 'Loops',
        summary:
          'for, while, and do-while loops, nested loops, and controlling them with break and continue.',
        youtubeId: 'F6n9PsnKPz8',
        durationSeconds: 4281,
      },
      {
        number: 5,
        title: 'Arrays & Strings',
        summary:
          'One- and two-dimensional arrays, traversing and searching them, and working with C strings.',
        youtubeId: 'ZwelCGkQxgQ',
        durationSeconds: 6122,
      },
      {
        number: 6,
        title: 'Functions & Recursion',
        summary:
          'Declaring and calling functions, parameters and return values, scope, and thinking recursively.',
        youtubeId: 'r_zwHVnixG4',
        durationSeconds: 5060,
      },
      {
        number: 7,
        title: 'Pointers & Structures',
        summary:
          'Addresses and pointers, pointer arithmetic, passing by reference, and grouping data with structs.',
        youtubeId: 'zJkskPaxyxc',
        durationSeconds: 6280,
      },
    ],
  },
]

export function findCourse(slug: string | undefined): Course | undefined {
  return COURSES.find((course) => course.slug === slug)
}

export function courseSeconds(course: Course): number {
  return course.lessons.reduce((total, lesson) => total + lesson.durationSeconds, 0)
}

/** Playlist page on YouTube — the fallback when an embed can't play. */
export function playlistUrl(course: Course): string {
  return `https://www.youtube.com/playlist?list=${course.playlistId}`
}

/**
 * 1280×720 frame for a lesson. Every lesson in `COURSES` has been verified to
 * have a `maxresdefault` thumbnail; `LessonPlayer` still handles a load failure
 * so a future addition can't ship a broken image.
 */
export function lessonThumbnail(lesson: Lesson): string {
  return `https://i.ytimg.com/vi/${lesson.youtubeId}/maxresdefault.jpg`
}
