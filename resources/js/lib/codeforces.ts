/**
 * Get the Codeforces rating color class based on rating value
 */
export function getRatingColor(rating: number | null): string {
    if (rating === null || rating <= 0) {
        return 'bg-slate-500';
    }

    if (rating < 1200) {
        return 'bg-gray-500';
    }

    if (rating < 1400) {
        return 'bg-green-600';
    }

    if (rating < 1600) {
        return 'bg-cyan-600';
    }

    if (rating < 1900) {
        return 'bg-blue-600';
    }

    if (rating < 2100) {
        return 'bg-purple-600';
    }

    if (rating < 2300) {
        return 'bg-orange-500';
    }

    if (rating < 2400) {
        return 'bg-orange-600';
    }

    if (rating < 2600) {
        return 'bg-red-600';
    }

    if (rating < 3000) {
        return 'bg-red-700';
    }

    return 'bg-red-800';
}

/**
 * Get the Codeforces rating title based on rating value
 */
export function getRatingTitle(rating: number | null): string {
    if (rating === null || rating <= 0) {
        return 'Unrated';
    }

    if (rating < 1200) {
        return 'Newbie';
    }

    if (rating < 1400) {
        return 'Pupil';
    }

    if (rating < 1600) {
        return 'Specialist';
    }

    if (rating < 1900) {
        return 'Expert';
    }

    if (rating < 2100) {
        return 'Candidate Master';
    }

    if (rating < 2300) {
        return 'Master';
    }

    if (rating < 2400) {
        return 'International Master';
    }

    if (rating < 2600) {
        return 'Grandmaster';
    }

    if (rating < 3000) {
        return 'International Grandmaster';
    }

    return 'Legendary Grandmaster';
}

/**
 * Format contest date to readable format
 */
export function formatContestDate(date: string | null): string {
    if (!date) {
        return 'Date not available';
    }

    try {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return date;
    }
}
