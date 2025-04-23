import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Word } from '@shared/schema';
import { Check, X, ArrowRight, Shuffle, BookOpen, Edit3, Bookmark, List, HelpCircle, RotateCcw, FileText, Pen } from 'lucide-react';

import { PracticeMode } from './types';

interface VocabPracticeProps {
  words: Word[];
  day: number;
  mode: PracticeMode | PracticeMode[]; // Can be a single mode or an array of modes for mixed practice
  onComplete: (score: number, total: number, modeStats?: { mode: PracticeMode; correct: number; total: number; percentage: number; }[]) => void;
  onBack: () => void;
  questionsPerSession?: number; // Optional parameter to control number of questions
  showHints?: boolean; // Optional parameter to control hints visibility
  useBookmarked?: boolean; // Flag to indicate if we're practicing with bookmarked words
  selectedDays?: number[]; // Optional parameter for the selected days when using bookmarked words
  mixedPractice?: boolean; // Flag to indicate if this is a mixed practice session
}

// Interface for tracking question history
// Create a more flexible synonyms type that matches all possible formats from the API
type SynonymsType = string | string[] | Record<string, string> | null | undefined;

interface QuestionHistory {
  wordId: number;
  word: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  definition: string;
  synonyms?: string[] | string;
  mode?: PracticeMode; // Track which mode was used for this question
}

// Utility function to safely process synonyms in any format
function processSynonyms(rawSynonyms: any): string[] {
  try {
    if (!rawSynonyms) return [];
    
    // If it's already a string array, return it directly
    if (Array.isArray(rawSynonyms) && rawSynonyms.every(item => typeof item === 'string')) {
      return rawSynonyms;
    }
    
    // If it's a JSON string, try to parse it
    if (typeof rawSynonyms === 'string') {
      // Check if it might be a JSON string
      if (rawSynonyms.startsWith('[') && rawSynonyms.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawSynonyms);
          if (Array.isArray(parsed)) {
            return parsed.map(s => String(s));
          }
        } catch (jsonError) {
          // Not valid JSON, treat as comma-separated string
          console.log('Not valid JSON, treating as comma-separated string', rawSynonyms);
        }
      }
      // Process as comma-separated list
      return rawSynonyms.split(',').map(s => s.trim());
    }
    
    // Handle arrays of any type by converting elements to strings
    if (Array.isArray(rawSynonyms)) {
      return rawSynonyms.map(s => String(s));
    }
    
    // Handle objects by getting all values
    if (typeof rawSynonyms === 'object' && rawSynonyms !== null) {
      return Object.values(rawSynonyms).map(v => String(v));
    }
    
    // Default case
    return [];
  } catch (error) {
    console.error('Error processing synonyms:', error, 'Raw synonyms:', JSON.stringify(rawSynonyms));
    return [];
  }
}

const VocabPracticeMode: React.FC<VocabPracticeProps> = ({ 
  words, 
  day, 
  mode, 
  onComplete, 
  onBack,
  questionsPerSession = 10, // Default to 10 questions per session
  showHints = true, // Default to showing hints
  useBookmarked = false, // Default to false for bookmarked mode
  selectedDays = [] // Default to empty array for selected days
}) => {
  const { toast } = useToast();
  
  // Convert mode to array for consistent handling
  const modeArray = Array.isArray(mode) ? mode : [mode];
  const isMixedMode = modeArray.length > 1;
  
  // Log component rendering for debugging
  console.log(`Rendering VocabPracticeMode - mode: ${Array.isArray(mode) ? mode.join(',') : mode}, day: ${day}, wordCount: ${words.length}, qps: ${questionsPerSession}, hints: ${showHints}, bookmarked: ${useBookmarked}, selectedDays: ${selectedDays.join(',')}`);
  
  // Detailed debug for words array
  console.log("Input words:", words.length, "words", words.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{word: string, definition: string}[]>([]);
  // Use a ref to store the shuffled options to prevent constant regeneration
  const shuffledOptionsRef = React.useRef<{word: string, definition: string}[]>([]);
  // Use refs to track previous index and mode for comparison
  const prevIndexRef = React.useRef<number>(-1);
  const prevModeRef = React.useRef<PracticeMode | null>(null);
  const [progress, setProgress] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [showHint, setShowHint] = useState(false);
  
  // For mixed mode, track the current mode for each question
  const [currentQuestionMode, setCurrentQuestionMode] = useState<PracticeMode>(
    Array.isArray(mode) ? mode[0] : mode
  );
  
  // Select a subset of words for the practice session
  const practiceWords = useMemo(() => {
    console.log("Creating practice words with:", words.length, "words");
    
    // Early return if no words
    if (!words || words.length === 0) {
      console.error("No words available to create practice set");
      return [];
    }
    
    // If fewer words than needed, use all of them
    if (words.length <= questionsPerSession) {
      console.log("Using all available words:", words.length);
      return words;
    }
    
    // Shuffle the words and take the first 'questionsPerSession' number
    const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, questionsPerSession);
    
    console.log(`[VocabPracticeMode] Prepared ${shuffledWords.length} words for practice, mode: ${mode}, hints: ${showHints ? 'enabled' : 'disabled'}`);
    
    return shuffledWords;
  }, [words, questionsPerSession, mode, showHints]);
  
  // Select the mode for the current question
  useEffect(() => {
    console.log(`[VocabPracticeMode] Setting up mode for question: ${currentIndex}, words available: ${practiceWords.length}`);
    if (practiceWords.length > 0 && currentIndex < practiceWords.length) {
      console.log('[VocabPracticeMode] Current word:', practiceWords[currentIndex]);
      
      // If mixed mode, select a random mode for this question
      if (isMixedMode && currentIndex > 0) {
        const randomModeIndex = Math.floor(Math.random() * modeArray.length);
        const newMode = modeArray[randomModeIndex];
        console.log(`[VocabPracticeMode] Selected random mode for question ${currentIndex}: ${newMode}`);
        setCurrentQuestionMode(newMode);
      }
    } else {
      console.log('[VocabPracticeMode] No words available or currentIndex out of bounds');
    }
  }, [currentIndex, isMixedMode, modeArray, practiceWords]);
  
  // Define the prepare question function 
  const prepareQuestionForMode = useCallback(() => {
    if (!practiceWords || practiceWords.length === 0) return;
    
    // Reset state for new question
    setUserAnswer('');
    setShowAnswer(false);
    setIsCorrect(null);
    setShowHint(false);
    
    // For synonym-matching and definition-matching, prepare shuffled options
    if (currentQuestionMode === 'synonym-matching' || currentQuestionMode === 'definition-matching') {
      // Get 3 random words + the current word
      const currentWord = practiceWords[currentIndex];
      
      if (!currentWord) return;
      
      // Check if we already have options for this index in our ref
      if (shuffledOptionsRef.current.length > 0) {
        console.log(`[VocabPracticeMode] Using existing options for ${currentQuestionMode}`);
        return;
      }
      
      const otherWords = practiceWords
        .filter((_, idx) => idx !== currentIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const options = [...otherWords, currentWord].sort(() => 0.5 - Math.random());
      console.log(`[VocabPracticeMode] Preparing options for ${currentQuestionMode}:`, options);
      
      const mappedOptions = options.map(word => {
        // Get the first synonym for synonym mode, or definition for definition mode
        // Use the utility function for processing synonyms
        const synonyms = processSynonyms(word.synonyms);
        console.log(`[VocabPracticeMode] Processing word '${word.word}' with synonyms:`, word.synonyms, "processed to:", synonyms);
        
        const result = {
          word: word.word,
          definition: currentQuestionMode === 'synonym-matching' 
            ? (synonyms[0] || 'No synonym available') 
            : word.definition
        };
        
        return result;
      });
      
      console.log(`[VocabPracticeMode] Final shuffled options:`, mappedOptions);
      // Store in both state and ref to prevent re-rendering issues
      setShuffledOptions(mappedOptions);
      shuffledOptionsRef.current = mappedOptions;
    }
    
    // For fill-blanks mode, prepare a sentence with the word blanked out
    if (currentQuestionMode === 'fill-blanks') {
      // Nothing special to prepare, we'll use the example sentence
    }
    
    // For spelling mode, nothing to prepare
  }, [currentIndex, currentQuestionMode, practiceWords]);

  // Prepare options for the current question when mode or index changes
  useEffect(() => {
    console.log(`[VocabPracticeMode] Preparing question for mode: ${currentQuestionMode}, currentIndex: ${currentIndex}`);
    if (practiceWords.length > 0 && currentIndex < practiceWords.length) {
      // Only reset options ref when changing to a new question (index changes)
      if ((currentQuestionMode === 'synonym-matching' || currentQuestionMode === 'definition-matching') && 
          (prevIndexRef.current !== currentIndex || prevModeRef.current !== currentQuestionMode)) {
        console.log(`[VocabPracticeMode] Resetting options - index changed from ${prevIndexRef.current} to ${currentIndex} or mode changed from ${prevModeRef.current} to ${currentQuestionMode}`);
        shuffledOptionsRef.current = [];
        // Update the previous index/mode refs
        prevIndexRef.current = currentIndex;
        prevModeRef.current = currentQuestionMode;
      }
      prepareQuestionForMode();
    }
  }, [currentIndex, currentQuestionMode, prepareQuestionForMode, practiceWords]);

  const checkAnswer = () => {
    if (userAnswer.trim() === '') {
      toast({
        title: "Please enter an answer",
        description: "You need to provide an answer before checking",
        variant: "destructive"
      });
      return;
    }
    
    let correct = false;
    const currentWord = practiceWords[currentIndex];
    
    switch (currentQuestionMode) {
      case 'synonym-matching':
        // Check if user selected the correct word for the synonym
        const selectedWord = shuffledOptions.find(opt => opt.word === userAnswer);
        
        // Safely handle synonyms in any format using our utility function
        const correctSynonyms = processSynonyms(currentWord.synonyms).map(s => s.toLowerCase());
        
        // Debug the answer checking process  
        console.log(`[VocabPracticeMode] Checking answer for synonym matching:`, {
          selectedWord: selectedWord?.word,
          currentWord: currentWord.word,
          synonym: shuffledOptions.find(opt => opt.word === currentWord.word)?.definition,
          synonymsOfCurrentWord: correctSynonyms
        });
        
        // The word selected by the user should match the current word for this to be correct
        correct = selectedWord?.word.toLowerCase() === currentWord.word.toLowerCase();
        break;
        
      case 'definition-matching':
        // Check if user selected the correct word for the definition
        correct = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
        break;
        
      case 'fill-blanks':
        // Check if user's answer matches the current word
        correct = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
        break;
        
      case 'spelling':
        // Check if user's spelling matches the current word
        correct = userAnswer.toLowerCase() === currentWord.word.toLowerCase();
        break;
    }
    
    setIsCorrect(correct);
    setShowAnswer(true);
    
    // Record this question in history for the review
    // Process synonyms for safe storage using our utility function
    const processedSynonyms = processSynonyms(currentWord.synonyms);
    
    setQuestionHistory(prev => [...prev, {
      wordId: currentWord.id,
      word: currentWord.word,
      userAnswer: userAnswer,
      correctAnswer: currentWord.word,
      isCorrect: correct,
      definition: currentWord.definition,
      synonyms: processedSynonyms.length > 0 ? processedSynonyms : undefined,
      // Store the mode used for this question for the review screen
      mode: currentQuestionMode
    }]);
    
    if (correct) {
      setScore(score + 1);
      // No toast notification, feedback is shown inline
    } else {
      // No toast notification, feedback is shown inline
    }
    
    // Add to completed words
    setCompletedWords(prev => [...prev, currentWord.id]);
    
    // Update progress
    setProgress(((completedWords.length + 1) / practiceWords.length) * 100);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };
  
  const handleOptionSelect = (value: string) => {
    setUserAnswer(value);
  };
  
  const goToNextQuestion = () => {
    if (currentIndex < practiceWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Show review screen instead of immediately completing
      setShowReview(true);
    }
  };
  
  const completeSession = () => {
    // Calculate mode-specific statistics for mixed practice
    let modeStats: { mode: PracticeMode; correct: number; total: number; percentage: number }[] = [];
    
    // If this is a mixed practice session, calculate per-mode statistics
    if (Array.isArray(mode) && mode.length > 1 && questionHistory.length > 0) {
      // Get unique modes used during this practice session
      const modesWithHistory = questionHistory
        .filter(item => item.mode) // Filter out any questions without mode info
        .map(item => item.mode as PracticeMode);
      
      // Use Array.from(new Set()) instead of spread operator with Set for better compatibility
      const practiceModesUsed = Array.from(new Set(modesWithHistory));
      
      // For each mode, calculate statistics
      modeStats = practiceModesUsed.map(practiceMode => {
        // Filter history for just this mode's questions
        const modeQuestions = questionHistory.filter(item => item.mode === practiceMode);
        const modeCorrect = modeQuestions.filter(item => item.isCorrect).length;
        const modeTotal = modeQuestions.length;
        const modePercentage = modeTotal > 0 ? Math.round((modeCorrect / modeTotal) * 100) : 0;
        
        return {
          mode: practiceMode,
          correct: modeCorrect,
          total: modeTotal,
          percentage: modePercentage
        };
      });
      
      console.log(`[VocabPracticeMode] Mixed practice stats:`, modeStats);
    }
    
    // Practice complete - pass the mode stats if available
    onComplete(score, practiceWords.length, modeStats.length > 0 ? modeStats : undefined);
  };
  
  // Render the review component when practice is done
  const renderReview = () => {
    return (
      <div className="flex flex-col space-y-6 p-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Practice Review</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Score:</span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold">
              {score} / {practiceWords.length} ({Math.round((score / practiceWords.length) * 100)}%)
            </span>
          </div>
        </div>
        
        <div className="grid gap-4 mt-4">
          {questionHistory.map((item, idx) => (
            <Card key={idx} className={cn(
              "border-l-4",
              item.isCorrect ? "border-l-green-500" : "border-l-red-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {item.isCorrect ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                    Question {idx + 1}
                  </CardTitle>
                  <div className="text-sm font-medium text-gray-500">
                    {item.mode === 'synonym-matching' ? 'Synonym Matching' :
                     item.mode === 'definition-matching' ? 'Definition Matching' :
                     item.mode === 'fill-blanks' ? 'Fill in the Blanks' : 'Spelling'}
                  </div>
                </div>
                <CardDescription>
                  Word: <span className="font-medium">{item.word}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Your answer:</p>
                    <p className={cn(
                      "font-medium",
                      item.isCorrect ? "text-green-600" : "text-red-600"
                    )}>
                      {item.userAnswer || "(no answer)"}
                    </p>
                  </div>
                  
                  {!item.isCorrect && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Correct answer:</p>
                      <p className="font-medium text-green-600">{item.correctAnswer}</p>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-500">Definition:</p>
                    <p className="text-gray-800 dark:text-gray-200">{item.definition}</p>
                  </div>
                  
                  {item.synonyms && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Synonyms:</p>
                      <p className="text-gray-800 dark:text-gray-200">
                        {processSynonyms(item.synonyms).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  const renderPracticeContent = () => {
    if (!practiceWords || practiceWords.length === 0) {
      // Display different empty state messages based on practice mode
      if (useBookmarked) {
        return (
          <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
            <Bookmark className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">No bookmarked words available</h3>
            {selectedDays.length > 0 ? (
              <p className="text-amber-700 dark:text-amber-400">
                You don't have any bookmarked words for the selected days ({selectedDays.sort((a,b) => a-b).join(', ')}).
                Try selecting different days or bookmark some words first.
              </p>
            ) : (
              <p className="text-amber-700 dark:text-amber-400">
                You haven't bookmarked any vocabulary words yet. 
                Go to the vocabulary learning section and bookmark words you want to practice.
              </p>
            )}
          </div>
        );
      } else {
        return (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
            <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">No vocabulary words available</h3>
            <p className="text-blue-700 dark:text-blue-400">
              There are no vocabulary words available for Day {day}.
              Please try selecting a different day.
            </p>
          </div>
        );
      }
    }
    
    // Safety check for currentIndex being out of bounds
    if (currentIndex >= practiceWords.length) {
      console.error(`[VocabPracticeMode] currentIndex (${currentIndex}) out of bounds for practiceWords array (length: ${practiceWords.length})`);
      return <div>Error: Index out of bounds. Please try again.</div>;
    }
    
    const currentWord = practiceWords[currentIndex];
    
    // Additional safety check for currentWord being undefined
    if (!currentWord) {
      console.error(`[VocabPracticeMode] currentWord is undefined at index ${currentIndex}`);
      return <div>Error: Word data unavailable. Please try again.</div>;
    }
    switch (currentQuestionMode) {
      case 'synonym-matching':
        return (
          <div className="space-y-6">
            {/* Enhanced question header with improved visuals */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10 p-5 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-700/20 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/30 rounded-full transform -translate-x-6 translate-y-6"></div>
              
              <div className="relative">
                <h3 className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-300 flex items-center">
                  <span className="bg-blue-600 dark:bg-blue-500 text-white p-1.5 rounded-lg mr-2 shadow-sm">
                    <BookOpen size={18} />
                  </span>
                  Match the Synonym
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 ml-9">
                  Select the word that matches this synonym:
                </p>
                <div className="ml-9 mt-4 p-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-sm">
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {shuffledOptions && shuffledOptions.length > 0 
                      ? (shuffledOptions.find(opt => opt.word === currentWord.word)?.definition || "No synonym available")
                      : "Loading synonyms..."}
                  </p>
                </div>
              </div>
            </div>
            
            {shuffledOptions && shuffledOptions.length > 0 ? (
              <RadioGroup value={typeof userAnswer === 'string' ? userAnswer : ''} onValueChange={handleOptionSelect} className="space-y-3">
                {shuffledOptions.map((option, idx) => {
                  const isSelected = userAnswer === option.word;
                  const isCorrect = option.word === currentWord.word && showAnswer;
                  const isIncorrect = isSelected && showAnswer && !isCorrect;
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center space-x-2 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2",
                        isSelected && !showAnswer ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md" : 
                        isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md" :
                        isIncorrect ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                        "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      )}
                      onClick={() => !showAnswer && handleOptionSelect(option.word)}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-5 w-5 rounded-full border transition-all",
                        isSelected ? "border-blue-500 bg-blue-500" : 
                        "border-gray-300 dark:border-gray-600"
                      )}>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      <Label 
                        htmlFor={`option-${idx}`} 
                        className={cn(
                          "flex-1 cursor-pointer font-medium text-base transition-colors",
                          isSelected && !showAnswer ? "text-blue-700 dark:text-blue-300" : 
                          isCorrect ? "text-green-700 dark:text-green-300" :
                          isIncorrect ? "text-red-700 dark:text-red-300" :
                          "text-gray-800 dark:text-gray-200"
                        )}
                      >
                        {option.word}
                      </Label>
                      
                      {showAnswer && (
                        <>
                          {isCorrect && (
                            <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                              <Check size={18} />
                            </span>
                          )}
                          {isIncorrect && (
                            <span className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                              <X size={18} />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              <div className="flex justify-center p-6">
                <div className="relative">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <div className="absolute inset-0 animate-ping opacity-30 h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" style={{ animationDuration: '2s' }}></div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'definition-matching':
        return (
          <div className="space-y-6">
            {/* Enhanced question header with improved visuals */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/10 p-5 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 dark:bg-purple-700/20 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 dark:bg-purple-700/30 rounded-full transform -translate-x-6 translate-y-6"></div>
              
              <div className="relative">
                <h3 className="text-lg font-medium mb-2 text-purple-800 dark:text-purple-300 flex items-center">
                  <span className="bg-purple-600 dark:bg-purple-500 text-white p-1.5 rounded-lg mr-2 shadow-sm">
                    <FileText size={18} />
                  </span>
                  Match the Definition
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 ml-9">
                  Select the word that matches this definition:
                </p>
                <div className="ml-9 mt-4 p-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-purple-100 dark:border-purple-900/50 shadow-sm">
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                    {currentWord?.definition || "Loading definition..."}
                  </p>
                </div>
              </div>
            </div>
            
            {shuffledOptions && shuffledOptions.length > 0 ? (
              <RadioGroup value={typeof userAnswer === 'string' ? userAnswer : ''} onValueChange={handleOptionSelect} className="space-y-3">
                {shuffledOptions.map((option, idx) => {
                  const isSelected = userAnswer === option.word;
                  const isCorrect = option.word === currentWord.word && showAnswer;
                  const isIncorrect = isSelected && showAnswer && !isCorrect;
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center space-x-2 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2",
                        isSelected && !showAnswer ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md" : 
                        isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md" :
                        isIncorrect ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                        "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                      )}
                      onClick={() => !showAnswer && handleOptionSelect(option.word)}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-5 w-5 rounded-full border transition-all",
                        isSelected ? "border-purple-500 bg-purple-500" : 
                        "border-gray-300 dark:border-gray-600"
                      )}>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      <Label 
                        htmlFor={`option-${idx}`} 
                        className={cn(
                          "flex-1 cursor-pointer font-medium text-base transition-colors",
                          isSelected && !showAnswer ? "text-purple-700 dark:text-purple-300" : 
                          isCorrect ? "text-green-700 dark:text-green-300" :
                          isIncorrect ? "text-red-700 dark:text-red-300" :
                          "text-gray-800 dark:text-gray-200"
                        )}
                      >
                        {option.word}
                      </Label>
                      
                      {showAnswer && (
                        <>
                          {isCorrect && (
                            <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                              <Check size={18} />
                            </span>
                          )}
                          {isIncorrect && (
                            <span className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                              <X size={18} />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              <div className="flex justify-center p-6">
                <div className="relative">
                  <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  <div className="absolute inset-0 animate-ping opacity-30 h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full" style={{ animationDuration: '2s' }}></div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'fill-blanks':
        const example = currentWord.example || '';
        let blankedExample = '';
        
        if (example) {
          // Generate blanked version for display
          blankedExample = example.replace(
            new RegExp(`<u>${currentWord.word}</u>`, 'gi'), 
            `<u>_______</u>`
          ); 
          
          // If word isn't already marked with <u> tags, try to find and replace it
          if (blankedExample === example) {
            blankedExample = example.replace(
              new RegExp(`\\b${currentWord.word}\\b`, 'gi'),
              `<u>_______</u>`
            );
          }
        }
        
        // If we couldn't find the word in the example, create a generic one
        if (blankedExample === example || !example) {
          blankedExample = `The meaning of <u>_______</u> is: ${currentWord.definition}`;
        }
        
        return (
          <div className="space-y-6">
            {/* Enhanced question header with improved visuals */}
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/10 p-5 rounded-xl shadow-sm border border-green-200 dark:border-green-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 dark:bg-green-700/20 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200/30 dark:bg-green-700/30 rounded-full transform -translate-x-6 translate-y-6"></div>
              
              <div className="relative">
                <h3 className="text-lg font-medium mb-2 text-green-800 dark:text-green-300 flex items-center">
                  <span className="bg-green-600 dark:bg-green-500 text-white p-1.5 rounded-lg mr-2 shadow-sm">
                    <Edit3 size={18} />
                  </span>
                  Fill in the Blank
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 ml-9">
                  Complete the sentence with the correct word:
                </p>
                <div className="ml-9 mt-4 p-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-green-100 dark:border-green-900/50 shadow-sm">
                  <p className="text-lg font-medium text-green-900 dark:text-green-100 leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: blankedExample }} />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="fill-blank-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Your answer:
                  </Label>
                  <div className="relative">
                    <Input 
                      id="fill-blank-input"
                      type="text" 
                      placeholder="Type your answer here..." 
                      value={userAnswer || ''}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full pr-10 transition-all",
                        showAnswer && userAnswer?.toLowerCase() === currentWord.word.toLowerCase() 
                          ? "border-green-500 ring-green-500/20 bg-green-50 dark:bg-green-900/20" 
                          : showAnswer
                            ? "border-red-500 ring-red-500/20 bg-red-50 dark:bg-red-900/20"
                            : "focus:border-green-500 focus:ring-green-500/20"
                      )}
                      disabled={showAnswer}
                    />
                    {showAnswer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {userAnswer?.toLowerCase() === currentWord.word.toLowerCase() ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {showAnswer && userAnswer?.toLowerCase() !== currentWord.word.toLowerCase() && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Correct answer:</span> {currentWord.word}
                      </p>
                    </div>
                  )}
                </div>
                
                {showHints && !showAnswer && (
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-400 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 hover:border-green-200 transition-colors"
                      onClick={() => setShowHint(!showHint)}
                    >
                      <HelpCircle size={14} className="mr-1" />
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    
                    {showHint && (
                      <div className="mt-2 text-sm bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md shadow-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-300">Hint: </span>
                        <span className="text-amber-700 dark:text-amber-400">
                          The word starts with "{currentWord.word.slice(0, 2)}{currentWord.word.length > 4 ? '...' : ''}" and has {currentWord.word.length} letters.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'spelling':
        return (
          <div className="space-y-6">
            {/* Enhanced question header with improved visuals */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-900/10 p-5 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 dark:bg-amber-700/20 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-200/30 dark:bg-amber-700/30 rounded-full transform -translate-x-6 translate-y-6"></div>
              
              <div className="relative">
                <h3 className="text-lg font-medium mb-2 text-amber-800 dark:text-amber-300 flex items-center">
                  <span className="bg-amber-600 dark:bg-amber-500 text-white p-1.5 rounded-lg mr-2 shadow-sm">
                    <Pen size={18} />
                  </span>
                  Spelling Practice
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 ml-9">
                  Type the word that fits this definition:
                </p>
                <div className="ml-9 mt-4 p-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                  <p className="text-xl font-medium text-amber-900 dark:text-amber-100">
                    {currentWord?.definition || "Loading definition..."}
                  </p>
                  
                  {processSynonyms(currentWord.synonyms).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-100 dark:border-amber-800/30">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        <span className="font-medium">Synonyms: </span>
                        {processSynonyms(currentWord.synonyms).map((syn, idx) => (
                          <span key={idx} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs">
                            {syn}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="spelling-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Your answer:
                  </Label>
                  <div className="relative">
                    <Input 
                      id="spelling-input"
                      type="text" 
                      placeholder="Type the word here..." 
                      value={userAnswer || ''}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full pr-10 transition-all",
                        showAnswer && userAnswer?.toLowerCase() === currentWord.word.toLowerCase() 
                          ? "border-green-500 ring-green-500/20 bg-green-50 dark:bg-green-900/20" 
                          : showAnswer
                            ? "border-red-500 ring-red-500/20 bg-red-50 dark:bg-red-900/20"
                            : "focus:border-amber-500 focus:ring-amber-500/20"
                      )}
                      disabled={showAnswer}
                    />
                    {showAnswer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {userAnswer?.toLowerCase() === currentWord.word.toLowerCase() ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {showAnswer && userAnswer?.toLowerCase() !== currentWord.word.toLowerCase() && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Correct spelling:</span> {currentWord.word}
                      </p>
                    </div>
                  )}
                </div>
                
                {showHints && !showAnswer && (
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-400 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 hover:border-amber-200 transition-colors"
                      onClick={() => setShowHint(!showHint)}
                    >
                      <HelpCircle size={14} className="mr-1" />
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    
                    {showHint && (
                      <div className="mt-2 text-sm bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md shadow-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-300">Hint: </span>
                        <span className="text-amber-700 dark:text-amber-400">
                          The word starts with "{currentWord.word.slice(0, 1)}" and has {currentWord.word.length} letters.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown practice mode: {currentQuestionMode}</div>;
    }
  };
  
  // If in review mode, show the review component
  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center py-1.5 text-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-lg pr-4 pl-1 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/10 via-transparent to-green-50/10 dark:from-green-900/10 dark:to-green-900/10"></div>
            <div className="relative">
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-2"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                <span className="font-medium">Back</span>
              </Button>
            </div>
          </div>
          <Button 
            onClick={completeSession} 
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm hover:shadow-md transition-all rounded-lg px-5"
          >
            <span className="flex items-center">
              Complete Practice
              <span className="ml-2 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse"></span>
            </span>
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/30 dark:to-gray-900 rounded-2xl -z-10 transform -rotate-1 opacity-70"></div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100/30 to-transparent dark:from-green-900/10 rounded-full translate-x-20 -translate-y-20 -z-10"></div>
            {renderReview()}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Enhanced Header with Modern Styling and Visual Hierarchy */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center py-1.5 text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-lg pr-4 pl-1 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-blue-50/20 dark:from-blue-900/20 dark:to-blue-900/20"></div>
            <div className="relative">
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 flex items-center space-x-1.5 font-medium transition-all duration-300 hover:scale-105"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                <span className="font-medium">Back</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-3 pr-2 py-1 shadow-sm">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
                {currentIndex + 1}/{practiceWords.length}
              </span>
              <div className="flex -space-x-1">
                {Array.from({ length: Math.min(3, practiceWords.length) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      i === currentIndex % 3 
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 ring-2 ring-white dark:ring-gray-800" 
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                    )}
                  >
                    {((currentIndex + i) % practiceWords.length) + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced progress bar with gradient */}
        <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div 
            className="absolute h-full left-0 top-0 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
          {/* Animated glow effect */}
          <div 
            className="absolute h-full left-0 top-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full opacity-70"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Card with enhanced styling for question content */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/30 dark:to-gray-900 rounded-2xl -z-10 transform -rotate-1 opacity-70"></div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100/30 to-transparent dark:from-green-900/10 rounded-full translate-x-20 -translate-y-20 -z-10"></div>
          {renderPracticeContent()}
        </div>
      </div>
      
      {/* Enhanced Button Row */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          disabled={!showAnswer}
          onClick={goToNextQuestion}
          className={cn(
            "border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg px-5 transition-all",
            !showAnswer ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
          )}
        >
          {currentIndex < practiceWords.length - 1 ? (
            <>Next Question <ArrowRight className="h-4 w-4 ml-2" /></>
          ) : (
            <>Review Results <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
        
        {!showAnswer && (
          <Button 
            onClick={checkAnswer} 
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm hover:shadow-md transition-all rounded-lg px-5"
          >
            <span className="flex items-center">
              Check Answer
              <span className="ml-2 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse"></span>
            </span>
          </Button>
        )}
        
        {showAnswer && isCorrect !== null && (
          <div className={cn(
            "flex items-center font-medium px-3 py-1 rounded-md",
            isCorrect 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          )}>
            {isCorrect ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Correct!
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-1.5" />
                Incorrect
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabPracticeMode;