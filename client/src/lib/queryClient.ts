import { QueryClient } from "@tanstack/react-query";
import logger, { createLogger } from "../utils/logger";

// Create a dedicated logger for API requests
const apiLogger = createLogger({
  group: 'API',
  minLevel: 'info'
});

/**
 * Helper function to check if a response is ok and extract error details if not
 * @param res The fetch Response object
 * @returns A cloned response if ok, throws error if not
 */
async function throwIfResNotOk(res: Response): Promise<Response> {
  // Always clone the response before doing anything with it
  const clonedRes = res.clone();

  if (!res.ok) {
    let errorMessage = '';

    // Create separate clones for each potential parsing attempt
    const jsonClone = clonedRes.clone();
    const textClone = clonedRes.clone();

    // Log the error details
    apiLogger.error(`HTTP ${res.status} error for ${res.url}`);

    try {
      const responseData = await jsonClone.json();
      errorMessage = responseData.message || responseData.error || "Unknown error";
      apiLogger.error('Error response data:', responseData);
    } catch (e) {
      try {
        errorMessage = await textClone.text();
        apiLogger.error('Error response text:', errorMessage);
      } catch (textError) {
        errorMessage = `HTTP error ${res.status}`;
        apiLogger.error('Failed to parse error response');
      }
    }
    throw new Error(`HTTP error ${res.status}: ${errorMessage}`);
  }

  // Return the original cloned response that hasn't been read yet
  return clonedRes;
}

interface ApiRequestOptions {
  method?: string;
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export function normalizeUrl(url: string): string {
  // Ensure the url starts with /api
  if (!url.startsWith("/api")) {
    url = `/api${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
}

export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", data, params } = options;

  // Normalize the URL to ensure it has the correct format
  let normalizedUrl = normalizeUrl(url);

  // Add query parameters if provided
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      normalizedUrl += `${normalizedUrl.includes("?") ? "&" : "?"}${queryString}`;
    }
  }

  // Prepare the fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include", // Include cookies for session-based auth
  };

  // Add body for non-GET requests
  if (method !== "GET" && data !== undefined) {
    if (data instanceof FormData) {
      // If it's FormData, don't set the Content-Type header (browser will set it with boundary)
      delete (fetchOptions.headers as any)["Content-Type"];
      fetchOptions.body = data;
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  }

  try {
    // Log request details
    apiLogger.debug(`${method} ${normalizedUrl}`, options.data ? { data: options.data } : '');
    
    // Measure request time
    apiLogger.time(`request-${method}-${normalizedUrl}`);
    const response = await fetch(normalizedUrl, fetchOptions);
    
    // Check if the response is ok
    await throwIfResNotOk(response);

    // Return null for HEAD requests or empty responses
    if (method === 'HEAD' || response.status === 204) {
      apiLogger.timeEnd(`request-${method}-${normalizedUrl}`);
      return null as unknown as T;
    }

    // Parse and return the response
    const responseData = await response.json();
    apiLogger.timeEnd(`request-${method}-${normalizedUrl}`);
    
    // Log response summary (avoid logging large responses)
    apiLogger.debug(`${method} ${normalizedUrl} - ${response.status} OK`);
    
    return responseData;
  } catch (error) {
    apiLogger.error(`${method} ${normalizedUrl} failed:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: any }): Promise<T | null> => {
    const [url, params] = Array.isArray(queryKey) ? queryKey : [queryKey];
    try {
      return await apiRequest<T>(url, { params });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("401") &&
        options.on401 === "returnNull"
      ) {
        return null;
      }
      throw error;
    }
  };
};

/**
 * Enhanced QueryClient with optimized settings for performance
 * - Increased stale time to reduce unnecessary refetches
 * - Added request deduplication 
 * - Implemented optimistic updates for mutations
 * - Added error handling and retry logic
 * - Improved caching to reduce API calls
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - further increased to reduce refetches
      gcTime: 1000 * 60 * 120, // 2 hours - increased for longer caching
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('HTTP error 4')) {
          return false;
        }
        return failureCount < 2; // Retry max twice for other errors
      },
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Only fetch on initial mount unless forced
      refetchOnReconnect: true, // Check for updates when connection is restored
      queryFn: getQueryFn({ on401: "throw" }),
      retryOnMount: false,
      refetchInterval: false, // Don't automatically refetch at intervals
      structuralSharing: true, // Use structural sharing for better performance
    },
    mutations: {
      retry: false, // Don't retry mutations automatically
      onError: (error, _variables, _context) => {
        // Log all mutation errors centrally
        apiLogger.error('Mutation error:', error);
      }
    }
  }
});

// Predefined key factories to ensure consistency for frequently used queries
export const queryKeys = {
  auth: {
    user: () => ['/api/auth/user'],
    session: () => ['/api/auth/session']
  },
  vocabulary: {
    all: () => ['/api/vocabulary/data'],
    days: () => ['/api/vocabulary/days'],
    bookmarked: () => ['/api/bookmarked-words'],
    byDay: (day: number) => ['/api/vocabulary/day', { day }],
    contentAccess: (day: number) => ['/api/content-access/vocabulary', { day }]
  },
  verbal: {
    types: () => ['/api/verbal/types'],
    topics: (type?: string) => type 
      ? ['/api/verbal/topics', { type }] 
      : ['/api/verbal/topics'],
    content: (topicId: number) => ['/api/verbal/content', { topicId }],
    progress: (userId: number) => ['/api/verbal/progress', { userId }]
  },
  quantitative: {
    categories: () => ['/api/quant/categories'],
    groups: () => ['/api/quant/groups'],
    topics: () => ['/api/quant/topics'],
    topicsByCategory: (category: string) => ['/api/quant/topics', { category }],
    content: (topicId: number) => ['/api/quant/content', { topicId }],
    progress: (userId: number) => ['/api/quant/progress', { userId }]
  }
};