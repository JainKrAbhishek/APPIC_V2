import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart4,
  FileQuestion,
  Filter,
  History,
  Package,
  Search,
  ShieldAlert,
  Sparkles,
  Clock,
  Inbox,
  UserX,
} from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { Badge } from "./badge";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title for the empty state
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Preset type of empty state
   */
  type?: "empty" | "no-results" | "filtered" | "error" | "not-found" | "no-data" | "no-access" | "coming-soon" | "no-activity" | "no-items";
  /**
   * Action button text
   */
  actionText?: string;
  /**
   * Callback for the action button
   */
  onAction?: () => void;
  /**
   * Secondary action button text
   */
  secondaryActionText?: string;
  /**
   * Callback for the secondary action button
   */
  onSecondaryAction?: () => void;
  /**
   * Compact layout
   */
  compact?: boolean;
  /**
   * Visual styling variant
   */
  variant?: "default" | "card" | "outlined" | "plain";
  /**
   * Optional image or illustration to display
   */
  image?: React.ReactNode;
  /**
   * Badge text to display (e.g. for "Beta" or "New" labels)
   */
  badgeText?: string;
}

/**
 * Component for displaying empty states with consistent styling
 */
export function EmptyState({
  title,
  description,
  icon,
  type = "empty",
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
  variant = "default",
  image,
  badgeText,
  className,
  ...props
}: EmptyStateProps) {
  // Determine the icon based on type if not explicitly provided
  const displayIcon = icon || getIconForType(type);
  
  // Determine default text based on type if not explicitly provided
  const displayTitle = title || getDefaultTitle(type);
  const displayDescription = description || getDefaultDescription(type);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-8",
        compact ? "py-4" : "py-10",
        getVariantStyles(variant),
        className
      )}
      {...props}
    >
      {/* Image (if provided) takes precedence over icon */}
      {image ? (
        <div className="mb-4">{image}</div>
      ) : (
        <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
          {displayIcon}
        </div>
      )}
      
      <div className="space-y-2 max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold">
            {displayTitle}
            {badgeText && (
              <Badge variant="outline" className="ml-2 align-middle text-xs">
                {badgeText}
              </Badge>
            )}
          </h3>
          {displayDescription && (
            <p className="text-sm text-muted-foreground">{displayDescription}</p>
          )}
        </div>
        
        {(actionText || secondaryActionText) && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {actionText && (
              <Button onClick={onAction}>{actionText}</Button>
            )}
            {secondaryActionText && (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getIconForType(type: EmptyStateProps["type"]) {
  switch (type) {
    case "no-results":
      return <Search className="h-6 w-6" />;
    case "filtered":
      return <Filter className="h-6 w-6" />;
    case "error":
      return <AlertCircle className="h-6 w-6" />;
    case "not-found":
      return <FileQuestion className="h-6 w-6" />;
    case "no-data":
      return <BarChart4 className="h-6 w-6" />;
    case "no-access":
      return <ShieldAlert className="h-6 w-6" />;
    case "coming-soon":
      return <Sparkles className="h-6 w-6" />;
    case "no-activity":
      return <History className="h-6 w-6" />;
    case "no-items":
      return <Package className="h-6 w-6" />;
    case "empty":
    default:
      return <Inbox className="h-6 w-6" />;
  }
}

function getDefaultTitle(type: EmptyStateProps["type"]) {
  switch (type) {
    case "no-results":
      return "No Search Results";
    case "filtered":
      return "No Matching Results";
    case "error":
      return "Something Went Wrong";
    case "not-found":
      return "Page Not Found";
    case "no-data":
      return "No Data Available";
    case "no-access":
      return "Access Restricted";
    case "coming-soon":
      return "Coming Soon";
    case "no-activity":
      return "No Recent Activity";
    case "no-items":
      return "No Items Found";
    case "empty":
    default:
      return "Nothing Here Yet";
  }
}

function getDefaultDescription(type: EmptyStateProps["type"]) {
  switch (type) {
    case "no-results":
      return "We couldn't find any results matching your search.";
    case "filtered":
      return "Try changing your filters to see more results.";
    case "error":
      return "An error occurred while processing your request.";
    case "not-found":
      return "The page you're looking for doesn't exist or has been moved.";
    case "no-data":
      return "There's no data available to display at the moment.";
    case "no-access":
      return "You don't have permission to access this resource.";
    case "coming-soon":
      return "This feature is under development and will be available soon.";
    case "no-activity":
      return "There hasn't been any activity in this section yet.";
    case "no-items":
      return "There are no items to display in this view.";
    case "empty":
    default:
      return "Start by adding some content to see it here.";
  }
}

function getVariantStyles(
  variant: EmptyStateProps["variant"]
): string {
  switch (variant) {
    case "card":
      return "rounded-lg border bg-card p-6 shadow-sm";
    case "outlined":
      return "rounded-lg border border-dashed p-6";
    case "plain":
      return "";
    case "default":
    default:
      return "rounded-lg bg-muted/40 p-6";
  }
}

export function NoResultsState({
  searchTerm,
  onClear,
  ...props
}: {
  searchTerm?: string;
  onClear?: () => void;
} & Omit<EmptyStateProps, "type" | "title" | "description" | "actionText" | "onAction">) {
  return (
    <EmptyState
      type="no-results"
      title={searchTerm ? `No results for "${searchTerm}"` : "No Search Results"}
      description="Try adjusting your search terms or filters."
      actionText={onClear ? "Clear Search" : undefined}
      onAction={onClear}
      {...props}
    />
  );
}

/**
 * Empty state for when no items exist yet
 */
export function NoItemsState({
  itemName = "items",
  canCreate = true,
  onCreate,
  ...props
}: {
  itemName?: string;
  canCreate?: boolean;
  onCreate?: () => void;
} & Omit<EmptyStateProps, "type" | "title" | "description" | "actionText" | "onAction">) {
  return (
    <EmptyState
      type="no-items"
      title={`No ${itemName} found`}
      description={`You don't have any ${itemName.toLowerCase()} yet.`}
      actionText={canCreate ? `Create ${itemName.replace(/s$/, '')}` : undefined}
      onAction={onCreate}
      {...props}
    />
  );
}

/**
 * Empty state for when data is currently loading
 */
export function LoadingState({
  message = "Loading data...",
  ...props
}: {
  message?: string;
} & Omit<EmptyStateProps, "title" | "icon">) {
  return (
    <EmptyState
      title={message}
      icon={<Clock className="h-6 w-6 animate-spin" />}
      variant="plain"
      {...props}
    />
  );
}

/**
 * Empty state for when a feature is coming soon
 */
export function ComingSoonState({
  featureName = "This feature",
  ...props
}: {
  featureName?: string;
} & Omit<EmptyStateProps, "type" | "title" | "description">) {
  return (
    <EmptyState
      type="coming-soon"
      title={`${featureName} Coming Soon`}
      description="We're working on this feature and it will be available soon."
      badgeText="Coming Soon"
      {...props}
    />
  );
}

/**
 * Empty state for when users don't have access to a resource
 */
export function NoAccessState({
  resourceName = "this resource",
  ...props
}: {
  resourceName?: string;
} & Omit<EmptyStateProps, "type" | "title" | "description" | "icon">) {
  return (
    <EmptyState
      type="no-access"
      title="Access Restricted"
      description={`You don't have permission to access ${resourceName}.`}
      icon={<UserX className="h-6 w-6" />}
      {...props}
    />
  );
}

/**
 * Empty state for filtered results with no matches
 */
export function FilteredEmptyState({
  onClearFilters,
  ...props
}: {
  onClearFilters?: () => void;
} & Omit<EmptyStateProps, "type" | "title" | "description" | "actionText" | "onAction">) {
  return (
    <EmptyState
      type="filtered"
      actionText={onClearFilters ? "Clear Filters" : undefined}
      onAction={onClearFilters}
      {...props}
    />
  );
}