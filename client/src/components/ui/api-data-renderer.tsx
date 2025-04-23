import React, { ReactNode } from "react";
import { ErrorState } from "./error-state";
import { Skeleton, SkeletonText } from "./skeleton";
import { EmptyState } from "./empty-state";

interface ApiDataRendererProps<T> {
  /**
   * The data to render
   */
  data: T | null;
  /**
   * Whether the data is still loading
   */
  isLoading: boolean;
  /**
   * Error that may have occurred during data fetching
   */
  error: Error | null;
  /**
   * Children function that receives the data
   */
  children: (data: T) => ReactNode;
  /**
   * The loading state to show (either a component or true for default)
   */
  loadingState?: ReactNode | boolean;
  /**
   * Custom error rendering
   */
  errorState?: ReactNode | ((error: Error) => ReactNode);
  /**
   * Custom empty state when data is empty but not null
   */
  emptyState?: ReactNode;
  /**
   * Function to check if data is empty
   */
  isDataEmpty?: (data: T) => boolean;
  /**
   * Whether to show retry button on error
   */
  showRetryOnError?: boolean;
  /**
   * Callback for retry button
   */
  onRetry?: () => void;
  /**
   * Additional data needed to render components
   */
  renderParams?: any;
}

/**
 * A generic component that handles API data loading, error, and empty states
 */
export function ApiDataRenderer<T>({
  data,
  isLoading,
  error,
  children,
  loadingState,
  errorState,
  emptyState,
  isDataEmpty,
  showRetryOnError = true,
  onRetry,
  renderParams,
}: ApiDataRendererProps<T>) {
  // Handle loading state
  if (isLoading) {
    // If a custom loading state is provided as a component
    if (loadingState && typeof loadingState !== "boolean") {
      return <>{loadingState}</>;
    }

    // Default loading state
    return (
      <div className="animate-pulse space-y-4 py-4">
        <SkeletonText lines={5} />
      </div>
    );
  }

  // Handle error state
  if (error) {
    // If a custom error function is provided
    if (typeof errorState === "function") {
      return <>{(errorState as Function)(error)}</>;
    }
    
    // If a custom error component is provided
    if (errorState) {
      return <>{errorState}</>;
    }
    
    // Default error state
    return (
      <ErrorState
        error={error}
        showRetry={showRetryOnError}
        onRetry={onRetry}
        className="my-4"
      />
    );
  }

  // Handle null data
  if (data === null || data === undefined) {
    return (
      <EmptyState
        type="no-data"
        title="No Data Available"
        description="There's no data to display at the moment."
        actionText={onRetry ? "Try Again" : undefined}
        onAction={onRetry}
        className="my-4"
      />
    );
  }

  // Check if data is empty using custom function or default check
  const dataIsEmpty =
    isDataEmpty
      ? isDataEmpty(data)
      : Array.isArray(data)
      ? data.length === 0
      : Object.keys(data).length === 0;

  // Handle empty data
  if (dataIsEmpty) {
    // If a custom empty state component is provided
    if (emptyState) {
      return <>{emptyState}</>;
    }
    
    // Default empty state
    return (
      <EmptyState
        type="no-items"
        title="No Items Found"
        description="There are no items to display."
        actionText={onRetry ? "Refresh" : undefined}
        onAction={onRetry}
        className="my-4"
      />
    );
  }

  // Render the data
  return <>{children(data)}</>;
}

/**
 * A specialized renderer for list data that provides pagination and filtering options
 */
export function ApiListRenderer<T>({
  data,
  isLoading,
  error,
  children,
  loadingState,
  errorState,
  emptyState,
  isDataEmpty,
  showRetryOnError = true,
  onRetry,
  renderParams,
  filter,
  filterValue,
  onFilterChange,
  searchTerm,
  onSearchChange,
  noResultsContent,
}: ApiDataRendererProps<T[]> & {
  filter?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  noResultsContent?: ReactNode;
}) {
  // Function to check if filtered results are empty
  const filteredDataIsEmpty = (data: T[]): boolean => {
    if (!data || data.length === 0) return true;
    
    // If there's filtering or search logic, apply it here
    let filteredData = [...data];
    
    if (filter && filterValue && typeof renderParams?.filterFn === 'function') {
      filteredData = filteredData.filter(item => 
        renderParams.filterFn(item, filter, filterValue)
      );
    }
    
    if (searchTerm && typeof renderParams?.searchFn === 'function') {
      filteredData = filteredData.filter(item => 
        renderParams.searchFn(item, searchTerm)
      );
    }
    
    return filteredData.length === 0;
  };

  // If filtering results in no data, show a specialized empty state
  if (data && (searchTerm || (filter && filterValue)) && filteredDataIsEmpty(data)) {
    return noResultsContent || (
      <EmptyState
        type="filtered"
        title={searchTerm ? `No results for "${searchTerm}"` : "No Matching Results"}
        description="Try different filters or search terms."
        actionText="Clear Filters"
        onAction={() => {
          if (onSearchChange) onSearchChange('');
          if (onFilterChange) onFilterChange('');
        }}
        className="my-4"
      />
    );
  }

  // Use the standard renderer for other cases
  return (
    <ApiDataRenderer
      data={data}
      isLoading={isLoading}
      error={error}
      children={children}
      loadingState={loadingState}
      errorState={errorState}
      emptyState={emptyState}
      isDataEmpty={isDataEmpty || filteredDataIsEmpty}
      showRetryOnError={showRetryOnError}
      onRetry={onRetry}
      renderParams={renderParams}
    />
  );
}