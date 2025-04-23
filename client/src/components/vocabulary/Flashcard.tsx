import React, { useState, useRef, useMemo } from 'react';
import { BookmarkIcon as BookmarkFilledIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Definition, VocabWord } from '@/components/vocabulary/types';
import { Word } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Volume2, Bookmark, RotateCw, Info, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardProps {
  word: Word | VocabWord;
  index: number;
  total: number;
  day?: number;
  bookmarked?: boolean;
  onToggleBookmark?: (wordId: number, bookmarked: boolean) => void;
  flipped?: boolean;
  onFlip?: () => void;
  bookmarkedCountInDay?: number;
  showBookmarkCount?: boolean;
}

// Note: Rich text formatting is now handled by RichTextContent 
// directly in specialized content components

// Define part of speech colors for badges
const posColors: Record<string, { bg: string, text: string, border: string }> = {
  'noun': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  'verb': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
  'adjective': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  'adverb': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  'pronoun': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
  'preposition': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  'conjunction': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
  'interjection': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  'default': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' }
};

const Flashcard = ({ 
  word, 
  index, 
  total, 
  day = 1, 
  bookmarked = false, 
  onToggleBookmark,
  bookmarkedCountInDay = 0,
  showBookmarkCount = false,
  flipped: propFlipped,
  onFlip
}: FlashcardProps) => {
  const [localFlipped, setLocalFlipped] = useState(false);
  
  // Use either prop-controlled flipped state or local state
  const flipped = propFlipped !== undefined ? propFlipped : localFlipped;

  // Speech synthesis for pronunciation
  const speechSynthesisSupported = 'speechSynthesis' in window;
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Function to handle flipping the card with better animation
  const toggleFlip = (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event propagation if the event is provided
    if (e) {
      e.stopPropagation();
    }
    
    // If we have an onFlip prop, use that
    if (onFlip) {
      onFlip();
    } else {
      // Otherwise use the local state
      setLocalFlipped(!localFlipped);
    }
  };

  // Function to pronounce the word
  const pronounceWord = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking pronunciation button
    
    if (speechSynthesisSupported) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create new speech utterance if needed
      if (!speechRef.current) {
        speechRef.current = new SpeechSynthesisUtterance();
      }
      
      // Set the text and voice properties
      const utterance = speechRef.current;
      utterance.text = wordText;
      utterance.rate = 0.9; // Slightly slower rate for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Use a US English voice if available
      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find(voice => voice.lang === 'en-US');
      if (usVoice) {
        utterance.voice = usVoice;
      }
      
      // Speak the word
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get the word text and check if it's a VocabWord or Word
  const wordText = typeof word.word === 'string' ? word.word : '';
  
  const definitions = 'definitions' in word 
    ? word.definitions 
    : [{ 
        part_of_speech: 'partOfSpeech' in word ? (word.partOfSpeech || 'unknown') : 'unknown', 
        definition: 'definition' in word ? word.definition : '', 
        sentence: 'example' in word ? (word.example || '') : '', 
        synonyms: 'synonyms' in word ? (word.synonyms || []) : [] 
      }];
  
  // Handle toggle bookmark (only available if word is from the database)
  const handleToggleBookmark = useMemo(() => {
    // Create a memoized event handler to prevent unnecessary rerenders
    return (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card flip
      e.preventDefault(); // Prevent any default actions
      e.nativeEvent.stopImmediatePropagation(); // Ensure event is completely stopped
      
      if (onToggleBookmark) {
        console.log("[Flashcard] Toggling bookmark for word", 'id' in word ? word.id : (word as any).key, "current state:", bookmarked);
        const wordId = 'id' in word ? word.id : (word as any).key;
        
        // Add a small delay to ensure the click event is fully processed
        // and to debounce multiple rapid clicks
        setTimeout(() => {
          onToggleBookmark(wordId, !bookmarked);
        }, 100);
      }
    };
  }, [word, bookmarked, onToggleBookmark]); // Only recreate if these dependencies change
  
  // Get the main part of speech for the front badge
  const mainPartOfSpeech = useMemo(() => {
    if (definitions && definitions.length > 0) {
      return definitions[0].part_of_speech || 'unknown';
    }
    return 'unknown';
  }, [definitions]);
  
  // Get color scheme for the part of speech
  const getColorForPoS = (pos: string) => {
    const normalizedPos = pos.toLowerCase();
    for (const key in posColors) {
      if (normalizedPos.includes(key)) {
        return posColors[key];
      }
    }
    return posColors.default;
  };
  
  const mainPosColor = getColorForPoS(mainPartOfSpeech);

  // Generate a gradient background based on the day number
  const cardGradient = useMemo(() => {
    // Use different color schemes based on the day
    const colorMap = [
      'from-blue-50 to-indigo-50', // day 1
      'from-purple-50 to-pink-50', // day 2
      'from-green-50 to-teal-50',  // day 3
      'from-amber-50 to-orange-50', // day 4
      'from-rose-50 to-red-50',    // day 5
      'from-indigo-50 to-blue-50',  // day 6
      'from-cyan-50 to-sky-50',    // day 7
    ];
    
    // Use word's day if available, otherwise use the provided day (defaulted to 1)
    const wordDay = 'day' in word ? word.day : day;
    return colorMap[((wordDay || 1) - 1) % colorMap.length];
  }, [word, day]);

  return (
    <div className="h-full w-full touch-manipulation">
      <div className="relative h-full w-full cursor-pointer" onClick={toggleFlip}>
        <div
          className={`absolute w-full h-full rounded-xl transition-all duration-200 ${flipped ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.2s ease-out, opacity 0.2s ease'
          }}
        >
          {/* Front of card */}
          <div className={`h-full w-full shadow-md border border-gray-100 bg-gradient-to-br ${cardGradient} rounded-xl flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300`}>
            {/* Card header */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100/50 bg-white/40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${mainPosColor.bg} ${mainPosColor.text} border-0 font-medium px-2.5 py-1 h-auto min-h-[24px]`}>
                  {mainPartOfSpeech}
                </Badge>
                <Badge variant="outline" className="text-xs font-normal bg-gray-50/80 text-gray-600 border-0 px-2.5 py-1 h-auto min-h-[24px]">
                  {'day' in word ? (
                    <>
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      Day {word.day}
                      {showBookmarkCount && bookmarkedCountInDay > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({bookmarkedCountInDay} saved)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Day {day}
                      {showBookmarkCount && bookmarkedCountInDay > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({bookmarkedCountInDay} saved)
                        </span>
                      )}
                    </>
                  )}
                </Badge>
              </div>
            </div>
            
            {/* Card content */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 relative">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 text-center">{wordText}</h2>
              
              <div className="flex flex-col items-center space-y-2 mt-2">
                {/* Pronunciation button */}
                {speechSynthesisSupported && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-gray-700 bg-white/40 hover:bg-white/60 active:bg-white/80 border-gray-100/50 p-1.5 sm:p-2 h-auto min-h-[32px] font-medium rounded-full touch-manipulation z-20"
                    onClick={pronounceWord}
                  >
                    <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Pronounce</span>
                  </Button>
                )}
                
                {/* Visible flip button for mobile users */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 bg-white/60 hover:bg-white/80 active:bg-white/90 border-gray-100/50 p-1.5 sm:p-2 h-auto min-h-[32px] font-medium rounded-full touch-manipulation z-20 mt-2"
                  onClick={toggleFlip}
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Tap to flip</span>
                </Button>
              </div>
              
              {/* Large invisible flip button covering most of card for better mobile touch */}
              <Button
                variant="ghost"
                className="absolute inset-0 w-full h-full bg-transparent hover:bg-transparent active:bg-transparent border-none shadow-none z-10 touch-manipulation"
                onClick={toggleFlip}
                aria-label="Flip card"
              />
            </div>
            
            {/* Card footer */}
            <div className="p-3 border-t border-gray-100/50 text-center bg-white/30">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Tap card or flip button to see definition</span>
                </div>
                <div className="text-gray-500 text-xs font-medium px-2.5 py-1 min-h-[24px] inline-flex items-center bg-white/60 rounded-full shadow-sm">
                  {index + 1}/{total}
                </div>
              </div>
            </div>
            
            {/* Front card bookmark button - bigger and more prominent */}
            <Button
              variant={bookmarked ? "default" : "outline"}
              size="lg"
              className={`absolute top-2 right-2 z-20 rounded-full p-2 h-12 w-12 touch-manipulation ${
                bookmarked 
                  ? "text-amber-600 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 shadow-sm border border-amber-200" 
                  : "text-gray-400 bg-white/70 hover:text-amber-500 hover:bg-amber-50 active:bg-amber-100 border-gray-100"
              }`}
              onClick={handleToggleBookmark}
            >
              {bookmarked ? (
                <BookmarkFilledIcon className="h-6 w-6" />
              ) : (
                <Bookmark className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Back of card */}
        <div
          className={`absolute w-full h-full rounded-xl transition-all duration-200 ${flipped ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            transition: 'transform 0.2s ease-out, opacity 0.2s ease'
          }}
        >
          <div className="h-full w-full bg-white shadow-md border border-gray-100 rounded-xl flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Card header */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <Badge variant="outline" className={`text-xs ${mainPosColor.bg} ${mainPosColor.text} border-0 font-medium shrink-0 px-2.5 py-1 h-auto min-h-[24px]`}>
                  {mainPartOfSpeech}
                </Badge>
                <div className="flex items-center gap-1">
                  <h3 className="text-base font-semibold text-gray-800 truncate">{wordText}</h3>
                  {'day' in word && (
                    <Badge variant="outline" className="text-xs font-normal bg-gray-50/80 text-gray-600 border-0 shrink-0 px-2.5 py-1 h-auto min-h-[24px]">
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      Day {word.day}
                      {showBookmarkCount && bookmarkedCountInDay > 0 && (
                        <span className="ml-1 text-amber-600">
                          ({bookmarkedCountInDay} saved)
                        </span>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Card content */}
            <div className="flex-grow overflow-y-auto p-3 md:p-4 pb-6 relative">
              {/* Large invisible flip button covering most of card for better mobile touch */}
              <Button
                variant="ghost"
                className="absolute inset-0 w-full h-full bg-transparent hover:bg-transparent active:bg-transparent border-none shadow-none z-10 touch-manipulation"
                onClick={toggleFlip}
                aria-label="Flip card back"
              />
              
              {definitions.map((def, i) => {
                const posColor = getColorForPoS(def.part_of_speech);
                return (
                  <div key={i} className={i > 0 ? "mt-4 pt-3 border-t border-gray-100" : ""}>
                    <div className="flex items-center mb-2">
                      <span className={cn("text-sm font-medium px-2.5 py-1 min-h-[24px] inline-flex items-center rounded", 
                        posColor.bg, posColor.text)}>
                        {def.part_of_speech}
                      </span>
                    </div>
                    
                    <div className="text-base md:text-lg text-gray-800 leading-relaxed font-medium relative z-20 pointer-events-none bg-white/70 p-3 rounded-md shadow-sm border border-gray-100/50">
                      {def.definition}
                    </div>
                    
                    {def.sentence && (
                      <div className="text-sm md:text-base text-gray-600 italic mt-3 border-l-2 border-amber-200 pl-3 relative z-20 pointer-events-none p-2 bg-amber-50/50 rounded-r-md">
                        "{def.sentence}"
                      </div>
                    )}
                    
                    {Array.isArray(def.synonyms) && def.synonyms.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-md shadow-sm relative z-20 pointer-events-none">
                        <span className="text-sm font-medium text-blue-700 mb-2 block">Synonyms:</span>
                        <div className="flex flex-wrap gap-2">
                          {def.synonyms.map((syn, s) => (
                            <span key={s} className="text-sm bg-white text-blue-700 px-3 py-1.5 min-h-[28px] inline-flex items-center rounded-full shadow-sm border border-blue-100">
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Card footer */}
            <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center">
                {speechSynthesisSupported && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mr-2 text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200 p-2 h-auto min-h-[32px] min-w-[32px] rounded-full touch-manipulation"
                    onClick={pronounceWord}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 px-3 h-auto min-h-[32px] text-xs text-gray-600 bg-white hover:bg-gray-100 active:bg-gray-200 border-gray-100 rounded-full touch-manipulation"
                  onClick={toggleFlip}
                >
                  <RotateCw className="h-3 w-3 mr-1.5" />
                  <span>Flip back</span>
                </Button>
              </div>
              
              <div className="text-gray-500 text-xs font-medium px-2.5 py-1 min-h-[24px] inline-flex items-center bg-white/60 rounded-full shadow-sm z-30">
                {index + 1}/{total}
              </div>
            </div>
            
            {/* Back card bookmark button - bigger and more prominent */}
            <Button
              variant={bookmarked ? "default" : "outline"}
              size="lg"
              className={`absolute top-2 right-2 z-20 rounded-full p-2 h-12 w-12 touch-manipulation ${
                bookmarked 
                  ? "text-amber-600 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 shadow-sm border border-amber-200" 
                  : "text-gray-400 bg-white/70 hover:text-amber-500 hover:bg-amber-50 active:bg-amber-100 border-gray-100"
              }`}
              onClick={handleToggleBookmark}
            >
              {bookmarked ? (
                <BookmarkFilledIcon className="h-6 w-6" />
              ) : (
                <Bookmark className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;