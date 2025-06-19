import { Tournament, tournaments } from '@/types/tournament';
import { CutoffPeriodInfo, CutoffPeriod } from '@/types/tournament';

export function getActiveTournaments(): Tournament[] {
  return tournaments.filter((t: Tournament) => t.active);
}

export function getInactiveTournaments(): Tournament[] {
  return tournaments.filter((t: Tournament) => !t.active);
}

export { getTournamentById } from '@/types/tournament';

export { tournaments };

/**
 * Determines the current cutoff period based on tournament timing
 * @param tournament Tournament with cutoff times
 * @returns Information about current period and submission availability
 */
export function getCutoffPeriodInfo(tournament: Tournament): CutoffPeriodInfo {
  const now = Date.now();
  const firstCutoff = new Date(tournament.first_cutoff_time).getTime();
  const secondCutoff = new Date(tournament.second_cutoff_time).getTime();

  if (now < firstCutoff) {
    return {
      current: 'before',
      canSubmitFirst: true,
      canSubmitSecond: false,
      timeUntilNextCutoff: firstCutoff - now,
    };
  } else if (now < secondCutoff) {
    return {
      current: 'first',
      canSubmitFirst: false,
      canSubmitSecond: true,
      timeUntilNextCutoff: secondCutoff - now,
    };
  } else {
    return {
      current: 'after',
      canSubmitFirst: false,
      canSubmitSecond: false,
    };
  }
}

/**
 * Gets the active cutoff period for new submissions
 * @param tournament Tournament with cutoff times
 * @returns The cutoff period that should be used for new submissions, or null if submissions are closed
 */
export function getActiveCutoffPeriod(tournament: Tournament): CutoffPeriod | null {
  const periodInfo = getCutoffPeriodInfo(tournament);
  
  if (periodInfo.canSubmitFirst) {
    return 'first';
  } else if (periodInfo.canSubmitSecond) {
    return 'second';
  }
  
  return null;
}

/**
 * Formats time remaining until next cutoff
 * @param milliseconds Time remaining in milliseconds
 * @returns Formatted string like "2h 15m" or "45m" or "30s"
 */
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Gets display text for the current cutoff period
 * @param periodInfo Cutoff period information
 * @returns User-friendly display text
 */
export function getCutoffPeriodDisplayText(periodInfo: CutoffPeriodInfo): string {
  switch (periodInfo.current) {
    case 'before':
      return 'Cutoff Period 1';
    case 'first':
      return 'Cutoff Period 2';
    case 'after':
      return 'Submissions Closed';
    default:
      return 'Unknown Period';
  }
}

/**
 * Gets the color class for the cutoff period badge
 * @param periodInfo Cutoff period information
 * @returns Tailwind color classes
 */
export function getCutoffPeriodColorClass(periodInfo: CutoffPeriodInfo): string {
  switch (periodInfo.current) {
    case 'before':
      return 'bg-blue-600 text-blue-100';
    case 'first':
      return 'bg-green-600 text-green-100';
    case 'after':
      return 'bg-red-600 text-red-100';
    default:
      return 'bg-gray-600 text-gray-100';
  }
}
