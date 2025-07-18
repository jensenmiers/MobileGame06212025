import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats bonus predictions for display in prediction strings
 * @param bracketReset - The bracket reset prediction
 * @param grandFinalsScore - The grand finals score prediction
 * @returns Formatted bonus string or empty string if no bonus predictions
 */
export function formatBonusPredictions(
  bracketReset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null,
  grandFinalsScore?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null
): string {
  const bonusParts: string[] = [];
  
  // Format bracket reset
  if (bracketReset) {
    switch (bracketReset) {
      case 'upper_no_reset':
        bonusParts.push('no_reset');
        break;
      case 'upper_with_reset':
        bonusParts.push('upper_reset');
        break;
      case 'lower_bracket':
        bonusParts.push('lower');
        break;
    }
  }
  
  // Format grand finals score
  if (grandFinalsScore) {
    switch (grandFinalsScore) {
      case 'score_3_0':
        bonusParts.push('3-0');
        break;
      case 'score_3_1':
        bonusParts.push('3-1');
        break;
      case 'score_3_2':
        bonusParts.push('3-2');
        break;
    }
  }
  
  // Return formatted string or empty if no bonus predictions
  return bonusParts.length > 0 ? ` [${bonusParts.join(', ')}]` : '';
}
