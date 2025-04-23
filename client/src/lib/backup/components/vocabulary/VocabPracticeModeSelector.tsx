import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Word } from '@shared/schema';
import { 
  BookOpen, 
  Bookmark, 
  List, 
  Edit3, 
  ArrowRight, 
  Brain, 
  CircleHelp, 
  Settings, 
  HelpCircle, 
  TimerOff,
  Check,
  X,
  Play,
  Shuffle,
  Layers
} from 'lucide-react';
import { PracticeMode } from './VocabPracticeMode';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';

interface VocabPracticeModeProps {
  words: Word[];
  bookmarkedWords?: Word[];
  onSelectMode: (
    mode: PracticeMode | PracticeMode[], 
    words: Word[], 
    day: number, 
    options?: {
      questionsPerSession?: number;
      showHints?: boolean;
      useBookmarked?: boolean;
      selectedDays?: number[];
      mixedPractice?: boolean;
    }
  ) => void;
  days: number[];
  onBack: () => void;
}

interface PracticeModeInfo {
  id: PracticeMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const VocabPracticeModeSelector: React.FC<VocabPracticeModeProps> = ({ 
  words, 
  bookmarkedWords = [],
  onSelectMode,
  days,
  onBack
}) => {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState<string>("single");
  const [selectedDay, setSelectedDay] = useState<number>(days[0] || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [questionsPerSession, setQuestionsPerSession] = useState<number>(10);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [useBookmarked, setUseBookmarked] = useState<boolean>(false);
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(!isMobile); // Expanded by default on desktop, collapsed on mobile
  
  // New state for multi-mode selection
  const [selectedModes, setSelectedModes] = useState<PracticeMode[]>([]);
  const mixedButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get words filtered by the selected day or use bookmarked words
  const isLoading = !words || words.length === 0;
  const hasBookmarks = bookmarkedWords && bookmarkedWords.length > 0;
  
  // Safe filtering - only filter if we have words
  let filteredWords: Word[] = [];
  
  if (useBookmarked) {
    if (hasBookmarks) {
      // Filter bookmarked words by selected days if any, otherwise show all
      if (selectedDays.length > 0) {
        filteredWords = bookmarkedWords.filter(word => selectedDays.includes(word.day));
      } else {
        // No days selected, show all bookmarked words
        filteredWords = bookmarkedWords;
      }
    }
  } else {
    // Regular day-based filtering
    if (!isLoading) {
      filteredWords = words.filter(word => word.day === selectedDay);
    }
  }
  
  // Practice modes information
  const practiceModes: PracticeModeInfo[] = [
    {
      id: 'synonym-matching',
      title: 'Synonym Matching',
      description: 'Match words with their synonyms to build your vocabulary connections.',
      icon: <BookOpen size={20} />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      difficulty: 'easy'
    },
    {
      id: 'definition-matching',
      title: 'Definition Matching',
      description: 'Choose the correct word that matches the given definition.',
      icon: <Bookmark size={20} />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      difficulty: 'medium'
    },
    {
      id: 'fill-blanks',
      title: 'Fill in the Blanks',
      description: 'Complete sentences by filling in the missing vocabulary word.',
      icon: <List size={20} />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      difficulty: 'medium'
    },
    {
      id: 'spelling',
      title: 'Spelling Practice',
      description: 'Practice spelling difficult GRE vocabulary words with hints.',
      icon: <Edit3 size={20} />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      difficulty: 'hard'
    }
  ];
  
  const handleDayChange = (value: string) => {
    setSelectedDay(Number(value));
  };
  
  // Update scroll into view for mobile UX
  useEffect(() => {
    if (selectedTab === 'mixed' && isMobile && mixedButtonRef.current) {
      setTimeout(() => {
        mixedButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedTab, isMobile]);
  
  const handleSingleModeSelect = (mode: PracticeMode) => {
    if (!filteredWords || filteredWords.length === 0) {
      return;
    }
    
    onSelectMode(mode, filteredWords, selectedDay, {
      questionsPerSession,
      showHints,
      useBookmarked,
      selectedDays: useBookmarked ? selectedDays : undefined,
      mixedPractice: false
    });
  };
  
  const handleMixedModeStart = () => {
    if (selectedModes.length === 0 || !filteredWords || filteredWords.length === 0) {
      return;
    }
    
    onSelectMode(selectedModes, filteredWords, selectedDay, {
      questionsPerSession,
      showHints,
      useBookmarked,
      selectedDays: useBookmarked ? selectedDays : undefined,
      mixedPractice: true
    });
  };
  
  // Toggle a practice mode selection
  const toggleModeSelection = (mode: PracticeMode) => {
    setSelectedModes(prev => 
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };
  
  // Toggle a day in the multiple selection
  const toggleDaySelection = (day: number) => {
    setSelectedDays(prevSelected => 
      prevSelected.includes(day)
        ? prevSelected.filter(d => d !== day)
        : [...prevSelected, day]
    );
  };
  
  // Get the difficulty badge styling
  const getDifficultyBadge = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Select all modes
  const selectAllModes = () => {
    setSelectedModes(practiceModes.map(mode => mode.id));
  };
  
  // Clear all selected modes
  const clearSelectedModes = () => {
    setSelectedModes([]);
  };
  
  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Practice Vocabulary</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Choose your practice mode preference</p>
        </div>
        
        <div className="flex items-center mt-3 sm:mt-0 space-x-2">
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            onClick={onBack}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-xs sm:text-sm h-8 px-2 sm:px-3 sm:h-10 bg-gray-50/70 rounded-md flex items-center gap-1 touch-manipulation"
          >
            <ArrowRight size={isMobile ? 14 : 16} className="rotate-180" />
            <span>Back to Words</span>
          </Button>
        </div>
      </div>
      
      {/* Settings Card with Collapsible Content on Mobile */}
      <Card className="mb-5 sm:mb-6 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
        <CardHeader 
          className={`pb-2 sm:pb-3 pt-4 px-4 sm:px-6 ${isMobile ? 'cursor-pointer touch-manipulation' : ''}`}
          onClick={() => isMobile && setSettingsExpanded(!settingsExpanded)}
        >
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-gray-100">Practice Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Customize your vocabulary practice experience
              </CardDescription>
            </div>
            {isMobile && (
              <div className="text-gray-400">
                {settingsExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent 
          className={`space-y-3 sm:space-y-4 px-4 sm:px-6 ${isMobile && !settingsExpanded ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="useBookmarked" className="text-xs sm:text-sm font-medium flex items-center">
                  <div className="flex justify-between w-full items-center">
                    <span>Use Bookmarked Words</span>
                    {hasBookmarks ? (
                      <span className="bg-primary/10 text-[10px] sm:text-xs text-primary px-1.5 sm:px-2 py-0.5 rounded-full">
                        {bookmarkedWords.length} saved
                      </span>
                    ) : (
                      <span className="bg-gray-100 dark:bg-gray-700 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 px-1.5 sm:px-2 py-0.5 rounded-full">
                        none saved
                      </span>
                    )}
                  </div>
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="useBookmarked" 
                    checked={useBookmarked} 
                    onCheckedChange={setUseBookmarked}
                    disabled={!hasBookmarks}
                  />
                  <Label htmlFor="useBookmarked" className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {hasBookmarks 
                      ? "Practice with words you've saved" 
                      : "Bookmark words first to enable this"}
                  </Label>
                </div>
              </div>
              
              {!useBookmarked && (
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="daySelect" className="text-xs sm:text-sm font-medium">Practice Day</Label>
                  <Select value={selectedDay.toString()} onValueChange={handleDayChange}>
                    <SelectTrigger id="daySelect" className="w-full text-xs sm:text-sm h-8 sm:h-10 touch-manipulation">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 sm:max-h-80">
                      {days.map((day) => (
                        <SelectItem key={day} value={day.toString()} className="text-xs sm:text-sm">
                          Day {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {useBookmarked && (
                <div className="flex flex-col space-y-1.5">
                  <Label className="text-sm font-medium flex justify-between">
                    <span>Select Days</span>
                    {selectedDays.length > 0 && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedDays.length} days selected
                      </span>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="justify-between w-full touch-manipulation"
                        disabled={!hasBookmarks}
                      >
                        <span>
                          {selectedDays.length === 0 
                            ? "All bookmarked words" 
                            : `${selectedDays.length} days selected`}
                        </span>
                        <CircleHelp size={16} className="ml-2 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="font-medium text-sm">Select Days</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose which days to include in your practice
                        </p>
                      </div>
                      
                      <div className="max-h-60 overflow-auto p-2">
                        <div className="flex flex-wrap gap-2 p-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 touch-manipulation"
                            onClick={() => setSelectedDays([])}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            All Days
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 touch-manipulation"
                            onClick={() => setSelectedDays(days)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Select All
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 touch-manipulation"
                            onClick={() => setSelectedDays(days.slice(0, 5))}
                          >
                            1-5
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 p-2">
                          {days.map((day) => (
                            <div 
                              key={day} 
                              className={cn(
                                "px-2 py-1.5 rounded-md text-center text-sm cursor-pointer border transition-colors touch-manipulation min-h-[32px] flex items-center justify-center",
                                selectedDays.includes(day)
                                  ? "bg-primary/10 border-primary/20 text-primary"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              )}
                              onClick={() => toggleDaySelection(day)}
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="questionsRange" className="text-sm font-medium">
                    Questions per Session
                  </Label>
                  <span className="text-gray-900 font-medium">{questionsPerSession}</span>
                </div>
                <Slider 
                  id="questionsRange"
                  min={5} 
                  max={30} 
                  step={5}
                  defaultValue={[questionsPerSession]}
                  onValueChange={(value) => setQuestionsPerSession(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5</span>
                  <span>15</span>
                  <span>30</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showHints" className="text-sm font-medium">Show Hints</Label>
                  <p className="text-xs text-gray-500">Display hints for more difficult questions</p>
                </div>
                <Switch 
                  id="showHints" 
                  checked={showHints} 
                  onCheckedChange={setShowHints}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Practice Mode Selection Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="single" 
            className="flex items-center justify-center gap-1 sm:gap-2 rounded-md h-8 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm touch-manipulation"
          >
            <Play size={isMobile ? 14 : 16} />
            <span>Single Mode</span>
          </TabsTrigger>
          <TabsTrigger 
            value="mixed" 
            className="flex items-center justify-center gap-1 sm:gap-2 rounded-md h-8 sm:h-10 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm touch-manipulation"
          >
            <Layers size={isMobile ? 14 : 16} />
            <span>Mix Modes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {practiceModes.map((mode) => (
              <Card 
                key={mode.id}
                className="border border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md active:scale-[0.98] active:shadow-sm active:bg-gray-50/80 dark:active:bg-gray-800/80 transition-all cursor-pointer touch-manipulation"
                onClick={() => handleSingleModeSelect(mode.id)}
              >
                <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4 px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg", mode.iconBg)}>
                      <div className={mode.iconColor}>{isMobile ? 
                        React.cloneElement(mode.icon as React.ReactElement, { size: 16 }) : 
                        mode.icon}
                      </div>
                    </div>
                    <div className={cn(
                      "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full", 
                      getDifficultyBadge(mode.difficulty)
                    )}>
                      {mode.difficulty}
                    </div>
                  </div>
                  <CardTitle className="text-sm sm:text-lg mt-3 sm:mt-4 text-gray-800 dark:text-gray-100">{mode.title}</CardTitle>
                </CardHeader>
                <CardContent className="py-1 sm:py-2 px-4 sm:px-6">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-3">
                    {mode.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-end pt-0 pb-3 sm:pb-4 px-4 sm:px-6">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/5 active:bg-primary/10 active:scale-[0.98] p-0 h-8 min-w-[60px] text-xs sm:text-sm transition touch-manipulation"
                  >
                    <span>Start</span> <ArrowRight size={isMobile ? 14 : 16} className="ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="mixed" className="space-y-3 sm:space-y-4">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl flex items-center text-gray-800 dark:text-gray-100">
                <Shuffle size={isMobile ? 16 : 18} className="mr-1.5 sm:mr-2" />
                Create Mixed Practice
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Combine multiple practice types for a more varied and challenging session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Select Practice Types</h3>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] border-gray-200 shadow-sm transition-transform touch-manipulation"
                      onClick={selectAllModes}
                    >
                      <Check size={isMobile ? 10 : 12} className="mr-1 opacity-70" />
                      <span>Select All</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] border-gray-200 shadow-sm transition-transform touch-manipulation"
                      onClick={clearSelectedModes}
                    >
                      <X size={isMobile ? 10 : 12} className="mr-1 opacity-70" />
                      <span>Clear</span>
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {practiceModes.map((mode) => (
                    <div 
                      key={mode.id}
                      className={cn(
                        "flex items-center p-2 sm:p-3 rounded-lg border cursor-pointer transition-all active:scale-[0.99] touch-manipulation",
                        selectedModes.includes(mode.id)
                          ? "bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40 active:bg-primary/10 dark:active:bg-primary/15"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700/80"
                      )}
                      onClick={() => toggleModeSelection(mode.id)}
                    >
                      <Checkbox 
                        checked={selectedModes.includes(mode.id)}
                        onCheckedChange={() => toggleModeSelection(mode.id)}
                        className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <div className={cn("p-1 sm:p-1.5 rounded-md mr-2 sm:mr-3", mode.iconBg)}>
                        <div className={mode.iconColor}>
                          {isMobile ? 
                            React.cloneElement(mode.icon as React.ReactElement, { size: 14 }) : 
                            mode.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">{mode.title}</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Your Mix</h3>
                
                {selectedModes.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    No practice types selected. Please select at least one type to start.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedModes.map(modeId => {
                      const mode = practiceModes.find(m => m.id === modeId);
                      return (
                        <Badge 
                          key={modeId} 
                          className="gap-1 sm:gap-1.5 bg-primary/10 text-primary border-0 hover:bg-primary/20 active:bg-primary/25 text-[10px] sm:text-xs h-5 sm:h-6 pr-1 touch-manipulation"
                        >
                          <span>{mode?.title}</span>
                          <button
                            className="p-1 rounded-full hover:bg-primary/10 active:bg-primary/20 flex items-center justify-center touch-manipulation" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModeSelection(modeId);
                            }}
                          >
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t bg-gray-50/50 dark:bg-gray-800/20 dark:border-gray-700 py-2 sm:py-3 px-4 sm:px-6">
              <Button 
                ref={mixedButtonRef}
                variant="default"
                size={isMobile ? "sm" : "default"}
                disabled={selectedModes.length === 0 || filteredWords.length === 0}
                onClick={handleMixedModeStart}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 font-medium active:scale-[0.98] active:bg-primary-600 dark:active:bg-primary-400 transition-transform touch-manipulation"
              >
                <Shuffle size={isMobile ? 14 : 16} />
                <span>Start Mixed Practice</span>
              </Button>
            </CardFooter>
          </Card>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 sm:p-4 mt-2 sm:mt-4">
            <div className="flex gap-2 sm:gap-3">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-amber-800 dark:text-amber-400 mb-1">Mixed Practice Tips</h4>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-500">
                  Mixed practice will randomly alternate between your selected practice types, creating a more challenging and effective learning experience. 
                  Research shows varied practice leads to better long-term retention.
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-amber-200/50 dark:border-amber-700/30">
                  <div className="flex items-center text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mb-1 sm:mb-1.5">
                    <Layers size={isMobile ? 12 : 14} className="mr-1 sm:mr-1.5 text-amber-600 dark:text-amber-500" />
                    <span className="font-medium">Current selection:</span>
                    <span className="ml-1 sm:ml-1.5 bg-amber-100 dark:bg-amber-900/30 px-1 sm:px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-400">{selectedModes.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {selectedModes.length > 0 ? (
                      selectedModes.map(modeId => {
                        const mode = practiceModes.find(m => m.id === modeId);
                        return (
                          <span 
                            key={modeId} 
                            className="inline-flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-500 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50"
                          >
                            {mode?.title}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 italic">No types selected yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VocabPracticeModeSelector;