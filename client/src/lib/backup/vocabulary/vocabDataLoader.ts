export interface Definition {
  part_of_speech: string;
  definition: string;
  sentence: string;
  synonyms: string[];
}

export interface VocabWord {
  key: number;
  group: number;
  word: string;
  definitions: Definition[];
}

/**
 * Load vocabulary data from a local JSON file
 * In a production environment, this would likely be fetched from an API
 */
export async function loadVocabularyData(): Promise<VocabWord[]> {
  try {
    // Check if we're in a browser environment first
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/vocabulary/data');
      const data = await response.json();
      
      // Map the data to match VocabWord structure if needed
      const words = data.map((word: any) => {
        const definitions = word.definitions || [{
          part_of_speech: word.partOfSpeech || '',
          definition: word.definition || '',
          sentence: word.example || '',
          synonyms: word.synonyms || []
        }];
        
        return {
          key: word.id,
          group: word.day || 1,
          word: word.word,
          definitions
        };
      });
      
      return words;
    } else {
      // For server-side rendering or Node.js environment
      return [];
    }
  } catch (error) {
    console.error('Error loading vocabulary data:', error);
    return [];
  }
}

/**
 * Group vocabulary words by day/group
 * @param words Array of vocabulary words
 * @returns Object with day numbers as keys and arrays of words as values
 */
export function groupVocabByDay(words: VocabWord[]): Record<number, VocabWord[]> {
  return words.reduce((groups, word) => {
    const day = word.group;
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(word);
    return groups;
  }, {} as Record<number, VocabWord[]>);
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
  }
  return words.filter(word => word.group === day);
}

/**
 * Get a random selection of words
 * @param words Array of vocabulary words
 * @param count Number of random words to select
 * @returns Array of randomly selected words
 */
export function getRandomWords(words: VocabWord[], count: number): VocabWord[] {
  // Make a copy to avoid mutating the original array
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, words.length));
}

/**
 * Search for words matching a search term
 * @param words Array of vocabulary words
 * @param searchTerm Term to search for
 * @returns Array of words matching the search term
 */
export function findWords(words: VocabWord[], searchTerm: string): VocabWord[] {
  if (!searchTerm.trim()) {
    return words;
  }

  const term = searchTerm.toLowerCase();
  
  return words.filter(word => {
    // Check if the word itself matches
    if (word.word.toLowerCase().includes(term)) {
      return true;
    }
    
    // Check if any definition matches
    return word.definitions.some(def => 
      def.definition.toLowerCase().includes(term) ||
      def.part_of_speech.toLowerCase().includes(term) ||
      def.sentence.toLowerCase().includes(term) ||
      def.synonyms.some(syn => syn.toLowerCase().includes(term))
    );
  });
}

/**
 * Get the total number of days/groups in the vocabulary data
 * @param words Array of vocabulary words
 * @returns Total number of days
 */
export function getTotalDays(words: VocabWord[]): number {
  if (words.length === 0) return 0;
  
  // Find the maximum group number
  return Math.max(...words.map(word => word.group));
}