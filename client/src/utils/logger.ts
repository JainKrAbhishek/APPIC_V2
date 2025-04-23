/**
 * Enhanced logger utility for better control of console logging
 * 
 * Features:
 * - Prevents excessive logging in production
 * - Configurable log levels (debug, info, warn, error)
 * - Colorized log groups for better visibility
 * - Performance timing utilities
 * - Log filtering by component/area
 * - Environment-aware logging behavior
 * - Centralized control through localStorage configuration
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'none';
type LogCategory = 'api' | 'ui' | 'data' | 'auth' | 'performance' | 'app' | string;

interface LoggerOptions {
  /** Name of the logger group, displayed in logs */
  group?: string;
  /** Category for grouping and filtering logs */
  category?: LogCategory; 
  /** Whether the logger is enabled. Default is true for development, false for production */
  enabled?: boolean;
  /** Minimum log level to display. Default is 'info' */
  minLevel?: LogLevel;
  /** Whether to show timestamps in logs. Default is false */
  showTimestamps?: boolean;
  /** Whether to include JSON format for objects. Default is false */
  prettyPrint?: boolean;
}

// Map log levels to their numeric values for comparison
const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

// Determine if we're in development mode
const isDev = import.meta.env.DEV === true;

// Get logging preferences from localStorage to allow runtime configuration
const getLoggerConfig = () => {
  if (typeof window === 'undefined') return {};
  
  try {
    const config = localStorage.getItem('logger_config');
    return config ? JSON.parse(config) : {};
  } catch (e) {
    return {};
  }
};

// Helper to save logger config
const saveLoggerConfig = (config: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('logger_config', JSON.stringify(config));
  } catch (e) {
    // Silent fail - localStorage might be disabled
  }
};

// Global logger configuration
const globalLoggerConfig = {
  // Get enabled state from localStorage or default to enabled in dev, disabled in prod
  enabled: getLoggerConfig().enabled ?? (isDev ? true : false),
  // Global minimum log level (can be overridden per logger)
  minLevel: getLoggerConfig().minLevel ?? (isDev ? 'info' : 'error') as LogLevel,
  // Specific category configuration
  categories: getLoggerConfig().categories ?? {
    // Default category settings to reduce noise
    ui: { minLevel: 'warn' },
    data: { minLevel: 'warn' },
    api: { minLevel: 'warn' },
    performance: { minLevel: 'warn' },
  },
  // Enhanced logger features
  features: {
    prettyPrint: getLoggerConfig().prettyPrint ?? false,
    showTimestamps: getLoggerConfig().showTimestamps ?? false,
    showCaller: getLoggerConfig().showCaller ?? false
  }
};

class Logger {
  private group: string;
  private category: LogCategory;
  private enabled: boolean;
  private minLevel: LogLevel;
  private showTimestamps: boolean;
  private prettyPrint: boolean;
  private timeLabels: Map<string, number>;

  constructor(options: LoggerOptions = {}) {
    this.group = options.group || 'App';
    this.category = options.category || 'app';
    
    // Use global config with instance overrides
    const categoryConfig = globalLoggerConfig.categories[this.category] || {};
    this.enabled = options.enabled ?? categoryConfig.enabled ?? globalLoggerConfig.enabled;
    this.minLevel = options.minLevel || categoryConfig.minLevel || globalLoggerConfig.minLevel;
    this.showTimestamps = options.showTimestamps ?? globalLoggerConfig.features.showTimestamps;
    this.prettyPrint = options.prettyPrint ?? globalLoggerConfig.features.prettyPrint;
    this.timeLabels = new Map();
  }

  /**
   * Log an informational message
   */
  info(...args: any[]): void {
    this.log('info', ...args);
  }

  /**
   * Log a warning message
   */
  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  /**
   * Log an error message
   */
  error(...args: any[]): void {
    this.log('error', ...args);
  }

  /**
   * Log a debug message (only in development by default)
   */
  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, ...args: any[]): void {
    // Check if logging is enabled and meets minimum level
    if (
      !this.enabled || 
      level === 'none' || 
      LOG_LEVEL_MAP[level] < LOG_LEVEL_MAP[this.minLevel]
    ) {
      return;
    }

    // Format arguments if pretty printing is enabled
    const formattedArgs = args.map(arg => {
      if (this.prettyPrint && typeof arg === 'object' && arg !== null) {
        try {
          // For objects, pretty print as JSON
          return typeof arg.toJSON === 'function' 
            ? arg.toJSON() 
            : JSON.stringify(arg, null, 2);
        } catch {
          // If JSON stringification fails, return the original
          return arg;
        }
      }
      return arg;
    });

    // Add timestamp if enabled
    const timestamp = this.showTimestamps 
      ? `[${new Date().toISOString().split('T')[1].split('Z')[0]}] ` 
      : '';
    
    // Format the group and category labels
    const groupLabel = `[${this.group}]`;
    const categoryLabel = this.category !== 'app' ? `[${this.category}]` : '';
    
    // Get the styling for the log
    const styles = this.getStyles(level);
    
    // Use the appropriate console method
    if (level === 'error') {
      console.error(
        timestamp, 
        `%c${groupLabel}%c ${categoryLabel}`, 
        styles.group, 
        styles.category, 
        ...formattedArgs
      );
    } else if (level === 'warn') {
      console.warn(
        timestamp, 
        `%c${groupLabel}%c ${categoryLabel}`, 
        styles.group, 
        styles.category, 
        ...formattedArgs
      );
    } else {
      console.log(
        timestamp, 
        `%c${groupLabel}%c ${categoryLabel}`, 
        styles.group, 
        styles.category, 
        ...formattedArgs
      );
    }
  }

  /**
   * Track state changes with before/after comparison
   */
  logStateChange(label: string, before: any, after: any): void {
    if (!this.enabled || LOG_LEVEL_MAP.debug < LOG_LEVEL_MAP[this.minLevel]) {
      return;
    }
    
    const styles = this.getStyles('info');
    console.group(`%c${this.group}%c State Change: ${label}`, styles.group, '');
    console.log('Before:', before);
    console.log('After:', after);
    console.groupEnd();
  }

  /**
   * Start a timer with the given label
   */
  time(label: string): void {
    if (!this.enabled) return;
    this.timeLabels.set(label, performance.now());
    this.debug(`⏱️ Timer started: ${label}`);
  }

  /**
   * End a timer and log the elapsed time
   */
  timeEnd(label: string): number | null {
    if (!this.enabled || !this.timeLabels.has(label)) return null;
    
    const startTime = this.timeLabels.get(label)!;
    const endTime = performance.now();
    const elapsed = endTime - startTime;
    
    this.timeLabels.delete(label);
    
    const formattedTime = elapsed < 1000 
      ? `${elapsed.toFixed(2)}ms` 
      : `${(elapsed / 1000).toFixed(2)}s`;
    
    // Use info level for regular timing, but warn if it's slow
    if (elapsed > 500) {
      this.warn(`⏱️ ${label}: ${formattedTime} (slow)`);
    } else {
      this.info(`⏱️ ${label}: ${formattedTime}`);
    }
    
    return elapsed;
  }

  /**
   * Set whether this logger is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    // Update global config
    if (this.category !== 'app') {
      if (!globalLoggerConfig.categories[this.category]) {
        globalLoggerConfig.categories[this.category] = {};
      }
      globalLoggerConfig.categories[this.category].enabled = enabled;
      saveLoggerConfig(globalLoggerConfig);
    } else {
      globalLoggerConfig.enabled = enabled;
      saveLoggerConfig(globalLoggerConfig);
    }
  }

  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
    
    // Update global config
    if (this.category !== 'app') {
      if (!globalLoggerConfig.categories[this.category]) {
        globalLoggerConfig.categories[this.category] = {};
      }
      globalLoggerConfig.categories[this.category].minLevel = level;
      saveLoggerConfig(globalLoggerConfig);
    } else {
      globalLoggerConfig.minLevel = level;
      saveLoggerConfig(globalLoggerConfig);
    }
  }

  /**
   * Get CSS styles for log output
   */
  private getStyles(level: LogLevel): { group: string, category: string } {
    const colors = {
      debug: '#6c757d',
      info: '#0d6efd',
      warn: '#ffc107',
      error: '#dc3545',
      none: '#000000'
    };
    
    const categoryColors: Record<LogCategory, string> = {
      api: '#7209b7',
      ui: '#4cc9f0',
      data: '#f72585',
      auth: '#4361ee',
      performance: '#fb8500',
      app: '#52b788'
    };

    return {
      group: `
        background-color: ${colors[level] || colors.info};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
      `,
      category: this.category !== 'app' ? `
        color: ${categoryColors[this.category] || '#888'};
        font-weight: bold;
      ` : ''
    };
  }
}

// Create specialized logger instances for different parts of the application
const defaultLogger = new Logger({ 
  group: 'App', 
  category: 'app',
  minLevel: isDev ? 'warn' : 'error'
});

// API requests logger
export const apiLogger = new Logger({
  group: 'API',
  category: 'api',
  minLevel: isDev ? 'warn' : 'error'
});

// UI component logger
export const uiLogger = new Logger({
  group: 'UI',
  category: 'ui',
  minLevel: isDev ? 'warn' : 'error'
});

// Data management logger
export const dataLogger = new Logger({
  group: 'Data',
  category: 'data',
  minLevel: isDev ? 'warn' : 'error'
});

// Authentication logger
export const authLogger = new Logger({
  group: 'Auth',
  category: 'auth',
  minLevel: isDev ? 'warn' : 'error' // Only log important auth operations
});

// Performance logger
export const perfLogger = new Logger({
  group: 'Perf',
  category: 'performance',
  minLevel: isDev ? 'warn' : 'error'
});

/**
 * Create a new custom logger with specific options
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * Utility to enable/disable all logging globally 
 */
export function setGlobalLogging(enabled: boolean): void {
  globalLoggerConfig.enabled = enabled;
  saveLoggerConfig(globalLoggerConfig);
  
  // Force refresh all loggers
  defaultLogger.setEnabled(enabled);
  apiLogger.setEnabled(enabled);
  uiLogger.setEnabled(enabled);
  dataLogger.setEnabled(enabled);
  authLogger.setEnabled(enabled);
  perfLogger.setEnabled(enabled);
}

/**
 * Toggle development debugging mode
 * Enables more verbose logging across all categories
 */
export function setDevDebugging(enabled: boolean): void {
  const level: LogLevel = enabled ? 'info' : 'warn';
  globalLoggerConfig.minLevel = level;
  
  // Apply to all loggers
  defaultLogger.setMinLevel(level);
  apiLogger.setMinLevel(level);
  uiLogger.setMinLevel(level);
  dataLogger.setMinLevel(level);
  authLogger.setMinLevel(level);
  perfLogger.setMinLevel(level);
  
  saveLoggerConfig(globalLoggerConfig);
}

// Export the default logger as the default export
export default defaultLogger;