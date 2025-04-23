import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  Play,
  Shuffle,
  Layers,
  Sparkles,
  Clock,
  Zap,
  LightbulbIcon,
  GraduationCap
} from 'lucide-react';
import { PracticeMode } from './types';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

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
  cardColor: string;
  gradientFrom: string;
  gradientTo: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Modern Vocabulary Practice Mode Selector with card-based UI
 * Enhanced with animations and visual improvements to match the new style
 */
export const ModernVocabPracticeModeSelector: React.FC<VocabPracticeModeProps> = ({ 
  words, 
  bookmarkedWords = [],
  onSelectMode,
  days,
  onBack
}) => {
  const isMobile = useIsMobile();
  const [selectedDay, setSelectedDay] = useState<number>(days[0] || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [questionsPerSession, setQuestionsPerSession] = useState<number>(10);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [useBookmarked, setUseBookmarked] = useState<boolean>(false);
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(!isMobile);
  const [activeTab, setActiveTab] = useState<"single" | "mixed">("single");
  
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
  
  // Practice modes information with enhanced styling
  const practiceModes: PracticeModeInfo[] = [
    {
      id: 'synonym-matching',
      title: 'Synonym Matching',
      description: 'Match words with their synonyms to build your vocabulary connections.',
      icon: <BookOpen size={24} />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      cardColor: 'from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      difficulty: 'easy'
    },
    {
      id: 'definition-matching',
      title: 'Definition Matching',
      description: 'Choose the correct word that matches the given definition.',
      icon: <Brain size={24} />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      cardColor: 'from-purple-50 to-white dark:from-purple-950/40 dark:to-gray-900',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      difficulty: 'medium'
    },
    {
      id: 'fill-blanks',
      title: 'Fill in the Blanks',
      description: 'Complete sentences by filling in the missing vocabulary word.',
      icon: <Edit3 size={24} />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      cardColor: 'from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-900',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      difficulty: 'medium'
    },
    {
      id: 'spelling',
      title: 'Spelling Practice',
      description: 'Practice spelling difficult GRE vocabulary words with hints.',
      icon: <GraduationCap size={24} />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      cardColor: 'from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      difficulty: 'hard'
    }
  ];
  
  const handleDayChange = (value: string) => {
    setSelectedDay(Number(value));
  };
  
  // Update scroll into view for mobile UX
  useEffect(() => {
    if (activeTab === 'mixed' && isMobile && mixedButtonRef.current) {
      setTimeout(() => {
        mixedButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [activeTab, isMobile]);
  
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="w-full px-4 sm:px-0"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      {/* Settings Card - Enhanced with modern styling and animations */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6 border border-green-200 dark:border-green-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardHeader 
            className={cn(
              "pb-3 pt-4 px-5 flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-gray-900",
              isMobile ? "cursor-pointer touch-manipulation" : ""
            )}
            onClick={() => isMobile && setSettingsExpanded(!settingsExpanded)}
          >
            <div>
              <CardTitle className="text-lg flex items-center text-gray-800 dark:text-gray-100">
                <Settings className="h-5 w-5 mr-2 text-green-500" />
                Practice Settings
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400 pt-1">
                Customize your vocabulary practice experience
              </CardDescription>
            </div>
            {isMobile && (
              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${settingsExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${settingsExpanded ? 'transform rotate-180' : ''}`} />
              </div>
            )}
          </CardHeader>
          
          <CardContent 
            className={cn(
              "space-y-5 px-5 transition-all",
              isMobile && !settingsExpanded ? "hidden" : "",
              isMobile && settingsExpanded ? "animate-in fade-in-50 slide-in-from-top-5 duration-300" : ""
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Word Source Selection */}
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <Label htmlFor="useBookmarked" className="text-sm font-medium flex items-center">
                      <Bookmark className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      <span>Use Bookmarked Words</span>
                    </Label>
                    
                    {hasBookmarks ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                        {bookmarkedWords.length} saved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        none saved
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch 
                      id="useBookmarked" 
                      checked={useBookmarked} 
                      onCheckedChange={setUseBookmarked}
                      disabled={!hasBookmarks}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <Label htmlFor="useBookmarked" className="text-xs text-gray-500 dark:text-gray-400">
                      {hasBookmarks 
                        ? "Practice with words you've saved" 
                        : "Bookmark words first to enable this"}
                    </Label>
                  </div>
                  
                  {useBookmarked ? (
                    <div className="flex flex-col space-y-2 mt-4">
                      <Label className="text-sm font-medium flex justify-between items-center">
                        <span className="flex items-center">
                          <Layers className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          Filter by Days
                        </span>
                        {selectedDays.length > 0 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                            {selectedDays.length} selected
                          </Badge>
                        )}
                      </Label>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="justify-between w-full"
                            disabled={!hasBookmarks}
                          >
                            <span className="flex items-center">
                              {selectedDays.length === 0 
                                ? `All Days (${bookmarkedWords.length} words)` 
                                : `${selectedDays.length} days selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm">Select Days</h4>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSelectedDays([])}
                              >
                                All days
                              </Button>
                            </div>
                          </div>
                          
                          <div className="max-h-[300px] overflow-auto p-2">
                            {(!bookmarkedWords || bookmarkedWords.length === 0) ? (
                              <div className="p-4 text-center">
                                <Bookmark className="h-10 w-10 mx-auto opacity-30 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No bookmarked words found</p>
                                <p className="text-xs text-gray-500">Bookmark words first to practice them</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div 
                                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                                  onClick={() => setSelectedDays([])}
                                >
                                  <Checkbox 
                                    className="mr-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                    checked={selectedDays.length === 0}
                                  />
                                  <Label className="cursor-pointer text-sm">All days</Label>
                                </div>
                                
                                {Array.from(new Set(bookmarkedWords.map(w => w.day))).sort((a, b) => a - b).map((day) => {
                                  const wordsForDay = bookmarkedWords.filter(w => w.day === day).length;
                                  return (
                                    <div 
                                      key={day} 
                                      className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                                      onClick={() => toggleDaySelection(day)}
                                    >
                                      <Checkbox 
                                        className="mr-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        checked={selectedDays.includes(day)}
                                      />
                                      <Label className="cursor-pointer text-sm">Day {day}</Label>
                                      <Badge variant="outline" className="ml-auto text-xs">{wordsForDay} words</Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2 mt-4">
                      <Label htmlFor="daySelect" className="text-sm font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        Practice Day
                      </Label>
                      <Select value={selectedDay.toString()} onValueChange={handleDayChange}>
                        <SelectTrigger id="daySelect" className="w-full text-sm">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60">
                          {days.map((day) => (
                            <SelectItem key={day} value={day.toString()} className="text-sm">
                              Day {day} {day === selectedDay && "- Current"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Settings Controls */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800/50">
                  <div className="mb-4">
                    <Label className="text-sm font-medium flex items-center mb-3">
                      <HelpCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Questions per Session
                    </Label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{questionsPerSession}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Max: 20</span>
                    </div>
                    <Slider
                      value={[questionsPerSession]}
                      min={5}
                      max={20}
                      step={1}
                      onValueChange={values => setQuestionsPerSession(values[0])}
                      className="[&>span]:bg-green-600"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <Label htmlFor="showHints" className="text-sm font-medium flex items-center">
                      <LightbulbIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Show Hints
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="showHints" 
                        checked={showHints} 
                        onCheckedChange={setShowHints}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label htmlFor="showHints" className="text-xs text-gray-500 dark:text-gray-400">
                        {showHints ? "Hints enabled for challenging questions" : "No hints during practice"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Tab buttons for Single vs Mixed mode selection */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === "single" ? "default" : "outline"}
          className={cn(
            "flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            activeTab === "single" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "text-gray-600 dark:text-gray-300"
          )}
          onClick={() => setActiveTab("single")}
        >
          <Play className={`h-4 w-4 mr-2 ${activeTab === "single" ? "text-white" : "text-gray-500"}`} />
          Single Mode Practice
        </Button>
        <Button
          variant={activeTab === "mixed" ? "default" : "outline"}
          className={cn(
            "flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            activeTab === "mixed" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "text-gray-600 dark:text-gray-300"
          )}
          onClick={() => setActiveTab("mixed")}
        >
          <Shuffle className={`h-4 w-4 mr-2 ${activeTab === "mixed" ? "text-white" : "text-gray-500"}`} />
          Mixed Mode Practice
        </Button>
      </div>
      
      {/* Content based on selected tab */}
      <div className="mb-6">
        {activeTab === "single" ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {practiceModes.map((mode) => (
              <motion.div key={mode.id} variants={cardVariants}>
                <Card 
                  className={`group overflow-hidden transition-all duration-300 shadow hover:shadow-md cursor-pointer h-full relative`}
                  onClick={() => handleSingleModeSelect(mode.id)}
                >
                  {/* Decorative background elements */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${mode.cardColor} -z-10`}></div>
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -z-10">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="75" cy="25" r="60" fill="currentColor" fillOpacity="0.3" className={mode.iconColor} />
                    </svg>
                  </div>
                  
                  <CardHeader className="flex flex-row items-start gap-4 p-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${mode.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <div className={mode.iconColor}>
                        {mode.icon}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{mode.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {mode.description}
                      </CardDescription>
                      <Badge 
                        className={`mt-3 ${getDifficultyBadge(mode.difficulty)}`}
                      >
                        {mode.difficulty.charAt(0).toUpperCase() + mode.difficulty.slice(1)} level
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardFooter className="pt-0 pb-5 px-5">
                    <Button 
                      className={`w-full bg-gradient-to-r ${mode.gradientFrom} ${mode.gradientTo} text-white group-hover:shadow-md transition-all`}
                      disabled={filteredWords.length === 0}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Practice
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-b border-gray-200 dark:border-gray-700 pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Shuffle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Mixed Practice Mode
                </CardTitle>
                <CardDescription>
                  Select multiple practice modes to create a mixed practice session
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {practiceModes.map((mode) => (
                    <div 
                      key={mode.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all",
                        selectedModes.includes(mode.id) 
                          ? `bg-${mode.iconColor.split('-')[1]}-50 border-${mode.iconColor.split('-')[1]}-200 dark:bg-${mode.iconColor.split('-')[1]}-900/20 dark:border-${mode.iconColor.split('-')[1]}-800` 
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      )}
                      onClick={() => toggleModeSelection(mode.id)}
                    >
                      <div className="flex gap-3 items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center",
                          selectedModes.includes(mode.id) 
                            ? `bg-gradient-to-r ${mode.gradientFrom} ${mode.gradientTo} text-white` 
                            : mode.iconBg
                        )}>
                          <div className={selectedModes.includes(mode.id) ? "text-white" : mode.iconColor}>
                            {mode.icon}
                          </div>
                        </div>
                        <div className="text-sm font-medium">{mode.title.split(' ')[0]}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearSelectedModes}
                    disabled={selectedModes.length === 0}
                    className="text-sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllModes}
                    disabled={selectedModes.length === practiceModes.length}
                    className="text-sm"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Select All
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  disabled={selectedModes.length === 0 || filteredWords.length === 0}
                  onClick={handleMixedModeStart}
                  ref={mixedButtonRef}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Start Mixed Practice ({selectedModes.length} modes)
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Word count indicator */}
      <div className="text-center py-4">
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-sm px-3 py-1">
          {filteredWords.length} {filteredWords.length === 1 ? "word" : "words"} available for practice
        </Badge>
      </div>
    </motion.div>
  );
};

export default ModernVocabPracticeModeSelector;