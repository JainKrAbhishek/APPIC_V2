import { VocabWord } from '../types';

/**
 * Find words matching a search term
 * @param words Array of vocabulary words
 * @param searchTerm Term to search for
 * @returns Array of words matching the search term
 */
export function findWords(words: VocabWord[], searchTerm: string): VocabWord[] {
  if (!searchTerm.trim()) return words;
  
  const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
  
  return words.filter(word => {
    // Check if the word itself matches
    if (word.word.toLowerCase().includes(lowercaseSearchTerm)) {
      return true;
    }
    
    // Check if any of the definitions match
    for (const def of word.definitions) {
      if (def.definition.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check if the sentence contains the search term
      if (def.sentence && def.sentence.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }
      
      // Check if any synonym contains the search term
      if (def.synonyms && def.synonyms.some(syn => 
        syn.toLowerCase().includes(lowercaseSearchTerm))
      ) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Get words for a specific day
 * @param words Array of vocabulary words
 * @param day Day number to filter by
 * @param includePreviousDays Whether to include words from previous days
 * @returns Filtered array of words
 */
export function getWordsForDay(words: VocabWord[], day: number, includePreviousDays: boolean = false): VocabWord[] {
  if (includePreviousDays) {
    return words.filter(word => word.group <= day);
  } else {
    return words.filter(word => word.group === day);
  }
}

/**
 * Get the total number of days/groups in the vocabulary data
 * @param words Array of vocabulary words
 * @returns Total number of days
 */
export function getTotalDays(words: VocabWord[]): number {
  if (!words.length) return 0;
  
  // Find the maximum group number
  return Math.max(...words.map(word => word.group));
}