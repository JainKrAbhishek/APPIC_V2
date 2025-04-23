import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  statusCode?: number;
  isFetching: boolean;
}

interface FetchOptions<T = any> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  successToastMessage?: string;
  showErrorToast?: boolean;
  errorToastMessage?: string;
  skipInitialFetch?: boolean;
  validateStatus?: (status: number) => boolean;
  headers?: HeadersInit;
  requireAuth?: boolean;
  retries?: number;
  retryDelay?: number;
  errorFallback?: React.ReactNode;
}

/**
 * A custom hook for making API requests with loading and error states
 */
export function useApiFetch<T = any>(
  url: string,
  options: FetchOptions<T> = {}
) {
  const { 
    initialData = null, 
    onSuccess, 
    onError,
    showSuccessToast = false,
    successToastMessage = 'Operation successful',
    showErrorToast = true,
    errorToastMessage, 
    skipInitialFetch = false,
    validateStatus = (status) => status >= 200 && status < 300,
    headers = {},
    requireAuth = true,
    retries = 0,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    isSuccess: false,
    status: 'idle',
    statusCode: undefined,
    isFetching: false,
  });

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(
    async (
      fetchUrl: string = url, 
      fetchOptions: RequestInit = {}, 
      customHeaders: HeadersInit = {}
    ) => {
      // Clear previous abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Set initial state
      setState((prevState) => ({
        ...prevState,
        isLoading: true,
        isFetching: true,
        error: null,
        status: 'loading',
        statusCode: undefined,
      }));

      try {
        // Prepare headers
        const allHeaders = {
          'Content-Type': 'application/json',
          ...headers,
          ...customHeaders,
        };

        // Make the fetch request
        const response = await fetch(fetchUrl, {
          signal: abortControllerRef.current.signal,
          headers: allHeaders,
          credentials: requireAuth ? 'include' : undefined,
          ...fetchOptions,
        });

        // Check if response is valid
        if (!validateStatus(response.status)) {
          let errorMessage = `Request failed with status ${response.status}`;
          
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // Failed to parse error as JSON, use default message
          }
          
          throw new Error(errorMessage);
        }

        // Parse response based on content type
        let data: T;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }

        // Success handling
        setState({
          data,
          isLoading: false,
          isFetching: false,
          error: null,
          isSuccess: true,
          status: 'success',
          statusCode: response.status,
        });

        if (onSuccess) {
          onSuccess(data);
        }

        if (showSuccessToast) {
          toast({
            title: successToastMessage,
            description: typeof data === 'object' && data && 'message' in data 
              ? (data as any).message 
              : undefined,
          });
        }

        // Reset retry count on success
        retryCountRef.current = 0;
        
        return data;
      } catch (err) {
        // Skip abort errors as they're intentional
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        
        // Check if we should retry
        if (retryCountRef.current < retries) {
          retryCountRef.current += 1;
          console.log(`Retrying fetch (${retryCountRef.current}/${retries})...`);
          
          setTimeout(() => {
            fetchData(fetchUrl, fetchOptions, customHeaders);
          }, retryDelay);
          
          return;
        }

        // Error handling
        setState({
          data: initialData,
          isLoading: false,
          isFetching: false,
          error,
          isSuccess: false,
          status: 'error',
          // Try to extract status code from error message
          statusCode: error.message.match(/status (\d+)/) 
            ? parseInt(error.message.match(/status (\d+)/)![1]) 
            : undefined,
        });

        if (onError) {
          onError(error);
        }

        if (showErrorToast) {
          toast({
            title: errorToastMessage || 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }

        // Reset retry count
        retryCountRef.current = 0;
        
        throw error;
      }
    },
    [
      url, 
      headers, 
      initialData, 
      onError, 
      onSuccess, 
      requireAuth, 
      retries, 
      retryDelay, 
      showErrorToast, 
      showSuccessToast, 
      successToastMessage, 
      errorToastMessage, 
      toast, 
      validateStatus
    ]
  );

  // Handle initial fetch
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchData();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, skipInitialFetch]);

  // Function to manually trigger the fetch
  const refetch = useCallback(
    (fetchOptions?: RequestInit, customHeaders?: HeadersInit) => {
      return fetchData(url, fetchOptions, customHeaders);
    },
    [fetchData, url]
  );

  // Function to manually update the data
  const updateData = useCallback(
    (newData: T | ((prevData: T | null) => T)) => {
      setState((prevState) => ({
        ...prevState,
        data: typeof newData === 'function' 
          ? (newData as ((prevData: T | null) => T))(prevState.data) 
          : newData,
        isSuccess: true,
        status: 'success',
        isFetching: false,
      }));
    },
    []
  );

  // Function to reset the state
  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      isFetching: false,
      error: null,
      isSuccess: false,
      status: 'idle',
      statusCode: undefined,
    });
  }, [initialData]);

  return {
    ...state,
    refetch,
    updateData,
    reset,
    fetch: fetchData
  };
}

/**
 * A hook for making POST requests
 */
export function useApiPost<T = any, R = any>(
  url: string,
  options: FetchOptions<R> = {}
) {
  const { fetch, ...rest } = useApiFetch<R>(url, {
    ...options,
    skipInitialFetch: true,
  });

  const mutate = useCallback(
    async (data: T, customUrl?: string, customHeaders?: HeadersInit) => {
      return fetch(customUrl || url, {
        method: 'POST',
        body: JSON.stringify(data),
      }, customHeaders);
    },
    [fetch, url]
  );

  return {
    ...rest,
    mutate,
  };
}

/**
 * A hook for making PUT requests
 */
export function useApiPut<T = any, R = any>(
  url: string,
  options: FetchOptions<R> = {}
) {
  const { fetch, ...rest } = useApiFetch<R>(url, {
    ...options,
    skipInitialFetch: true,
  });

  const mutate = useCallback(
    async (data: T, customUrl?: string, customHeaders?: HeadersInit) => {
      return fetch(customUrl || url, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, customHeaders);
    },
    [fetch, url]
  );

  return {
    ...rest,
    mutate,
  };
}

/**
 * A hook for making PATCH requests
 */
export function useApiPatch<T = any, R = any>(
  url: string,
  options: FetchOptions<R> = {}
) {
  const { fetch, ...rest } = useApiFetch<R>(url, {
    ...options,
    skipInitialFetch: true,
  });

  const mutate = useCallback(
    async (data: T, customUrl?: string, customHeaders?: HeadersInit) => {
      return fetch(customUrl || url, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, customHeaders);
    },
    [fetch, url]
  );

  return {
    ...rest,
    mutate,
  };
}

/**
 * A hook for making DELETE requests
 */
export function useApiDelete<R = any>(
  url: string,
  options: FetchOptions<R> = {}
) {
  const { fetch, ...rest } = useApiFetch<R>(url, {
    ...options,
    skipInitialFetch: true,
  });

  const mutate = useCallback(
    async (customUrl?: string, customHeaders?: HeadersInit) => {
      return fetch(customUrl || url, {
        method: 'DELETE',
      }, customHeaders);
    },
    [fetch, url]
  );

  return {
    ...rest,
    mutate,
  };
}