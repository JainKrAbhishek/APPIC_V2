import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Play, Pause, Settings, RefreshCw } from "lucide-react";

interface PomodoroTimerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  standalone?: boolean;
}

type TimerMode = "focus" | "shortBreak" | "longBreak";

const PomodoroTimer = ({ isOpen, onOpenChange, standalone = false }: PomodoroTimerProps) => {
  // Timer settings
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(true);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  
  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // References
  const timer = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Notifications
  const { toast } = useToast();
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/bell.mp3");
    
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem("pomodoroSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setFocusDuration(settings.focusDuration || 25);
        setShortBreakDuration(settings.shortBreakDuration || 5);
        setLongBreakDuration(settings.longBreakDuration || 15);
        setAutoStartBreaks(settings.autoStartBreaks !== undefined ? settings.autoStartBreaks : true);
        setAutoStartPomodoros(settings.autoStartPomodoros !== undefined ? settings.autoStartPomodoros : true);
        setLongBreakInterval(settings.longBreakInterval || 4);
      } catch (e) {
        console.error("Error loading pomodoro settings:", e);
      }
    }
    
    // Load timer state if available
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setTimerMode(state.timerMode || "focus");
        setTimeLeft(state.timeLeft || focusDuration * 60);
        setCompletedPomodoros(state.completedPomodoros || 0);
      } catch (e) {
        console.error("Error loading pomodoro state:", e);
      }
    }
  }, []);
  
  // Update timeLeft when durations change
  useEffect(() => {
    if (!isRunning) {
      if (timerMode === "focus") {
        setTimeLeft(focusDuration * 60);
      } else if (timerMode === "shortBreak") {
        setTimeLeft(shortBreakDuration * 60);
      } else if (timerMode === "longBreak") {
        setTimeLeft(longBreakDuration * 60);
      }
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, timerMode, isRunning]);
  
  // Save settings when they change
  useEffect(() => {
    const settings = {
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      autoStartBreaks,
      autoStartPomodoros,
      longBreakInterval
    };
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, [focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, autoStartPomodoros, longBreakInterval]);
  
  // Save timer state when it changes
  useEffect(() => {
    const state = {
      timerMode,
      timeLeft,
      completedPomodoros,
      isRunning
    };
    localStorage.setItem("pomodoroState", JSON.stringify(state));
  }, [timerMode, timeLeft, completedPomodoros, isRunning]);
  
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timer.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer is complete
            clearInterval(timer.current as NodeJS.Timeout);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer.current) {
      clearInterval(timer.current);
    }
    
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [isRunning]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
    
    // Show notification
    if (timerMode === "focus") {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      toast({
        title: "Focus session completed!",
        description: "Time for a break.",
        duration: 5000,
      });
      
      // Determine if it's time for a long break
      if (newCompletedPomodoros % longBreakInterval === 0) {
        setTimerMode("longBreak");
        setTimeLeft(longBreakDuration * 60);
        if (autoStartBreaks) {
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      } else {
        setTimerMode("shortBreak");
        setTimeLeft(shortBreakDuration * 60);
        if (autoStartBreaks) {
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      }
    } else {
      // Break is complete
      toast({
        title: "Break completed!",
        description: "Time to focus again.",
        duration: 5000,
      });
      
      setTimerMode("focus");
      setTimeLeft(focusDuration * 60);
      if (autoStartPomodoros) {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Start/pause timer
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };
  
  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === "focus") {
      setTimeLeft(focusDuration * 60);
    } else if (timerMode === "shortBreak") {
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setTimeLeft(longBreakDuration * 60);
    }
  };
  
  // Change timer mode
  const changeTimerMode = (mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === "focus") {
      setTimeLeft(focusDuration * 60);
    } else if (mode === "shortBreak") {
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setTimeLeft(longBreakDuration * 60);
    }
  };
  
  // Progress percentage for circular progress bar
  const getProgress = (): number => {
    let totalTime = 0;
    if (timerMode === "focus") {
      totalTime = focusDuration * 60;
    } else if (timerMode === "shortBreak") {
      totalTime = shortBreakDuration * 60;
    } else {
      totalTime = longBreakDuration * 60;
    }
    
    return (1 - timeLeft / totalTime) * 100;
  };
  
  // Save settings
  const saveSettings = () => {
    setShowSettings(false);
  };
  
  // Get color based on timer mode
  const getColorByMode = (): string => {
    switch (timerMode) {
      case "focus":
        return "from-primary to-primary-dark";
      case "shortBreak":
        return "from-emerald-500 to-emerald-600";
      case "longBreak":
        return "from-blue-500 to-blue-600";
      default:
        return "from-primary to-primary-dark";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pomodoro Timer</DialogTitle>
          <DialogDescription>
            Stay productive with focused work intervals and breaks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4">
          {!showSettings ? (
            <>
              {/* Mode Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 mb-6">
                <button
                  className={`px-4 py-2 rounded-full text-sm ${
                    timerMode === "focus" 
                      ? "bg-white dark:bg-gray-700 shadow text-primary" 
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                  onClick={() => changeTimerMode("focus")}
                >
                  Focus
                </button>
                <button
                  className={`px-4 py-2 rounded-full text-sm ${
                    timerMode === "shortBreak" 
                      ? "bg-white dark:bg-gray-700 shadow text-emerald-500" 
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                  onClick={() => changeTimerMode("shortBreak")}
                >
                  Short Break
                </button>
                <button
                  className={`px-4 py-2 rounded-full text-sm ${
                    timerMode === "longBreak" 
                      ? "bg-white dark:bg-gray-700 shadow text-blue-500" 
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                  onClick={() => changeTimerMode("longBreak")}
                >
                  Long Break
                </button>
              </div>
              
              {/* Timer Display */}
              <div className="relative w-48 h-48 mb-6">
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                  style={{
                    background: `conic-gradient(bg-gradient-to-r ${getColorByMode()} ${getProgress()}%, transparent ${getProgress()}%)`
                  }}
                >
                  <div className="w-[90%] h-[90%] rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  title="Reset Timer"
                >
                  <RefreshCw size={18} />
                </Button>
                
                <Button
                  variant="default"
                  size="lg"
                  onClick={toggleTimer}
                  className={`rounded-full w-14 h-14 bg-gradient-to-r ${getColorByMode()}`}
                >
                  {isRunning ? <Pause size={24} /> : <Play size={24} />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  <Settings size={18} />
                </Button>
              </div>
              
              {/* Pomodoro Counter */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Completed pomodoros: {completedPomodoros}
              </div>
            </>
          ) : (
            /* Settings */
            <div className="w-full space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="focus-duration"
                    min={5}
                    max={60}
                    step={5}
                    value={[focusDuration]}
                    onValueChange={(value) => setFocusDuration(value[0])}
                  />
                  <span className="w-10 text-center">{focusDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="short-break">Short Break (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="short-break"
                    min={1}
                    max={15}
                    step={1}
                    value={[shortBreakDuration]}
                    onValueChange={(value) => setShortBreakDuration(value[0])}
                  />
                  <span className="w-10 text-center">{shortBreakDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="long-break">Long Break (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="long-break"
                    min={5}
                    max={30}
                    step={5}
                    value={[longBreakDuration]}
                    onValueChange={(value) => setLongBreakDuration(value[0])}
                  />
                  <span className="w-10 text-center">{longBreakDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="long-break-interval">Long Break Interval</Label>
                <Select
                  value={longBreakInterval.toString()}
                  onValueChange={(value) => setLongBreakInterval(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Every 2 pomodoros</SelectItem>
                    <SelectItem value="3">Every 3 pomodoros</SelectItem>
                    <SelectItem value="4">Every 4 pomodoros</SelectItem>
                    <SelectItem value="5">Every 5 pomodoros</SelectItem>
                    <SelectItem value="6">Every 6 pomodoros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto-start-breaks"
                  checked={autoStartBreaks}
                  onChange={(e) => setAutoStartBreaks(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="auto-start-breaks">Auto-start breaks</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-start-pomodoros"
                  checked={autoStartPomodoros}
                  onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="auto-start-pomodoros">Auto-start pomodoros</Label>
              </div>
              
              <Button onClick={saveSettings} className="w-full mt-4">
                Save Settings
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {!standalone && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroTimer;