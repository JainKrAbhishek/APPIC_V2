import { useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';

/**
 * A hook for working with URL query parameters
 */
export function useQueryParams() {
  const [location] = useLocation();

  const searchParams = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams;
  }, [location]);

  const getParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  const setParam = useCallback((key: string, value: string | null | undefined, navigate = true): URLSearchParams => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === undefined) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    
    if (navigate) {
      const [path] = location.split('?');
      const newSearch = newParams.toString();
      const newUrl = newSearch ? `${path}?${newSearch}` : path;
      window.history.pushState(null, '', newUrl);
    }
    
    return newParams;
  }, [searchParams, location]);

  const setParams = useCallback((params: Record<string, string | null | undefined>, navigate = true): URLSearchParams => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    if (navigate) {
      const [path] = location.split('?');
      const newSearch = newParams.toString();
      const newUrl = newSearch ? `${path}?${newSearch}` : path;
      window.history.pushState(null, '', newUrl);
    }
    
    return newParams;
  }, [searchParams, location]);

  return {
    searchParams,
    getParam,
    getAllParams,
    setParam,
    setParams
  };
}