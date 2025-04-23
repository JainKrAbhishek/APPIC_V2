import { VocabWord } from '../types';

// Function to process a word and convert it to the VocabWord format
export const processWord = (word: any, day: number): VocabWord => {
  return {
    key: word.id,
    word: word.word,
    group: day,
    definitions: [{
      part_of_speech: word.partOfSpeech || '',
      definition: word.definition || '',
      sentence: word.example || '',
      synonyms: word.synonyms ? (
        typeof word.synonyms === 'string' ? 
        word.synonyms.split(',').map((s: string) => s.trim()) : 
        word.synonyms
      ) : []
    }]
  };
};

// Process multiple words
export const processWords = (words: any[], day: number): VocabWord[] => {
  return words.map(word => processWord(word, day));
};