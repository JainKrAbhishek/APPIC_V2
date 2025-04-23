/**
 * Performance optimization utilities to reduce unnecessary re-renders
 * and improve overall app performance.
 */

import { useRef, useEffect, useState, useCallback, DependencyList } from 'react';
import { perfLogger } from './logger';

/**
 * Hook that tracks render counts of a component for optimization
 * @returns The current render count for the component
 */
export function useRenderCount(): number {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return renderCount.current;
}

/**
 * Debounces a value change to reduce frequent updates
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a stable callback that only changes when dependencies change
 * and tracks performance metrics for the callback
 * @param callback The function to memoize and track
 * @param deps Dependencies array that should trigger a callback update
 * @param name Optional name for tracking performance
 * @returns Memoized callback with performance tracking
 */
export function useTrackedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  name?: string
): T {
  const callbackName = name || 'anonymous-callback';
  
  // Use useCallback for memoization
  const memoizedCallback = useCallback((...args: any[]) => {
    perfLogger.time(callbackName);
    const result = callback(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.finally(() => {
        perfLogger.timeEnd(callbackName);
      });
    }
    
    perfLogger.timeEnd(callbackName);
    return result;
  }, deps);
  
  return memoizedCallback as T;
}

/**
 * Use this hook to detect unnecessary re-renders and identify components that need optimization
 * @param componentName The name of the component (for logging)
 * @param props The component props (for comparison)
 * @param shouldLog Whether to log render info (default: only in development)
 */
export function useRenderOptimizer(componentName: string, props: any, shouldLog = import.meta.env.DEV): void {
  const renderCount = useRef(0);
  const prevPropsRef = useRef<any>(null);
  
  if (!shouldLog) return;
  
  const currentRender = ++renderCount.current;
  
  // Get changed props for debugging
  if (prevPropsRef.current) {
    const changedProps: string[] = [];
    const allKeys = new Set([
      ...Object.keys(prevPropsRef.current),
      ...Object.keys(props),
    ]);
    
    allKeys.forEach(key => {
      if (prevPropsRef.current[key] !== props[key]) {
        changedProps.push(key);
      }
    });
    
    if (changedProps.length > 0) {
      perfLogger.debug(
        `Component ${componentName} re-rendered (#${currentRender}) due to prop changes:`,
        changedProps.join(', ')
      );
    }
  }
  
  prevPropsRef.current = { ...props };
}

/**
 * Limits state updates to reduce re-renders
 * Only updates state when the new value is different from current value
 * @param initialState The initial state value
 * @returns [state, setState] tuple with throttled updates
 */
export function useStableState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void] {
  const [state, setStateInternal] = useState<T>(initialState);
  
  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setStateInternal(prevState => {
      const nextState = typeof newState === 'function'
        ? (newState as ((prevState: T) => T))(prevState)
        : newState;
      
      // Only update if the value has actually changed
      return Object.is(prevState, nextState) ? prevState : nextState;
    });
  }, []);
  
  return [state, setState];
}

/**
 * Similar to React.memo() but with more granular control for complex objects
 * Use this for expensive list item renders
 * @param value The value to memoize
 * @param comparator Optional custom equality function
 * @returns Memoized value that only changes when equality check fails
 */
export function useMemoizedValue<T>(
  value: T,
  comparator: (prev: T, current: T) => boolean = Object.is
): T {
  const ref = useRef<T>(value);
  
  if (!comparator(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Optimization for form inputs to prevent re-renders on every keystroke
 * @param initialValue Initial input value
 * @param debounceMs Debounce delay in milliseconds 
 * @returns [value, debouncedValue, setValue]
 */
export function useDebouncedInput<T>(
  initialValue: T,
  debounceMs: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce<T>(value, debounceMs);
  
  return [value, debouncedValue, setValue];
}