import { queryClient } from "@/lib/queryClient";

/**
 * Options for controlling cache invalidation behavior
 */
export interface PracticeSetInvalidationOptions {
  /**
   * Whether to include practice results queries in the invalidation
   */
  includeResults?: boolean;
  
  /**
   * Whether to include question queries in the invalidation
   */
  includeQuestions?: boolean;
  
  /**
   * Whether to immediately refetch the affected queries
   */
  immediate?: boolean;
}

/**
 * Invalidates practice set queries to ensure all components stay in sync
 * @param typeFilters Optional array of type filters to invalidate
 * @param options Additional options for controlling invalidation behavior
 */
export function invalidateAllPracticeSetQueries(
  typeFilters: string[] = [],
  options: PracticeSetInvalidationOptions = {}
) {
  // Default options
  const {
    includeResults = true,
    includeQuestions = false,
    immediate = false
  } = options;

  // Base invalidation for general practice sets endpoint
  queryClient.invalidateQueries({
    queryKey: ["/api/practice-sets"],
    exact: true,
    refetchType: immediate ? "active" : "none"
  });
  
  // Invalidate specific type-filtered endpoints
  if (typeFilters.length > 0) {
    // Invalidate each type-specific query
    typeFilters.forEach(type => {
      queryClient.invalidateQueries({
        queryKey: [`/api/practice-sets?type=${type}`],
        exact: true,
        refetchType: immediate ? "active" : "none"
      });
    });
  } else {
    // If no specific types provided, invalidate all type queries with pattern matching
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.startsWith('/api/practice-sets?type=');
      },
      refetchType: immediate ? "active" : "none"
    });
  }
  
  // Optionally invalidate related queries
  if (includeResults) {
    queryClient.invalidateQueries({
      queryKey: ["/api/practice-results"],
      refetchType: immediate ? "active" : "none"
    });
  }
  
  if (includeQuestions) {
    queryClient.invalidateQueries({
      queryKey: ["/api/questions"],
      refetchType: immediate ? "active" : "none"
    });
  }
}

/**
 * Invalidates all practice-related data
 * Useful when major changes to practice questions or sets have been made
 */
export function invalidateAllPracticeData(immediate: boolean = false) {
  invalidateAllPracticeSetQueries([], {
    includeQuestions: true,
    includeResults: true,
    immediate
  });
}