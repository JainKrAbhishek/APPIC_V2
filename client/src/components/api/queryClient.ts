import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const responseText = await res.text();
    let error;
    try {
      const json = JSON.parse(responseText);
      error = new Error(json.message || "Unknown error");
    } catch (e) {
      error = new Error(`HTTP error ${res.status}: ${responseText}`);
    }
    throw error;
  }
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
  
  // Make the request
  const response = await fetch(normalizedUrl, fetchOptions);
  
  // Check if the response is ok
  await throwIfResNotOk(response);
  
  // Parse and return the response
  return response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: any }) => {
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: getQueryFn({ on401: "throw" }),
    },
  },
});