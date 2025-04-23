import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface FormSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of form fields to show
   */
  fields?: number;
  /**
   * Whether to show a submit button
   */
  showSubmit?: boolean;
  /**
   * Whether to show a header
   */
  showHeader?: boolean;
  /**
   * Gap between form fields
   */
  gap?: "none" | "sm" | "md" | "lg";
  /**
   * Width of the form
   */
  width?: "auto" | "full" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether to include field hints
   */
  includeHints?: boolean;
  /**
   * Layout mode (default is stacked - labels above fields)
   */
  layout?: "stacked" | "inline" | "grid";
  /**
   * Whether to show field groups (e.g., name fields side by side)
   */
  fieldGroups?: { 
    /**
     * Array of field indexes that should be grouped (zero-based)
     * e.g., [[0, 1], [3, 4]] groups fields 0 and 1 together, and 3 and 4 together
     */
    indexes: number[][];
  };
}

/**
 * A skeleton component for forms to show while loading form data
 */
export function FormSkeleton({
  fields = 4,
  showSubmit = true,
  showHeader = true,
  gap = "md",
  width = "full",
  includeHints = true,
  layout = "stacked",
  fieldGroups,
  className,
  ...props
}: FormSkeletonProps) {
  // Gap between form elements
  const gapClasses = {
    none: "space-y-0",
    sm: "space-y-3",
    md: "space-y-4",
    lg: "space-y-6",
  };

  // Width of the form
  const widthClasses = {
    auto: "",
    full: "w-full",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Check if field should be part of a group
  const isFieldInGroup = (index: number): number[] | null => {
    if (!fieldGroups) return null;
    const group = fieldGroups.indexes.find(g => g.includes(index));
    return group || null;
  };

  return (
    <div 
      className={cn(
        gapClasses[gap], 
        widthClasses[width],
        className
      )} 
      {...props}
    >
      {/* Form header */}
      {showHeader && (
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      )}

      {/* Form fields */}
      <div className={cn(gapClasses[gap])}>
        {Array.from({ length: fields }).map((_, index) => {
          const group = isFieldInGroup(index);
          
          // If this field is part of a group and it's not the first field in the group, skip it
          // (we'll render the whole group when we encounter the first field)
          if (group && group.indexOf(index) > 0) {
            return null;
          }

          // If this is the first field in a group, render all fields in the group
          if (group && group.indexOf(index) === 0) {
            return (
              <div key={index} className="grid grid-cols-2 gap-4">
                {group.map(groupIndex => (
                  <FieldSkeleton 
                    key={groupIndex} 
                    layout={layout} 
                    includeHint={includeHints} 
                  />
                ))}
              </div>
            );
          }

          // Otherwise, render a single field
          return (
            <FieldSkeleton 
              key={index} 
              layout={layout} 
              includeHint={includeHints} 
            />
          );
        })}
      </div>

      {/* Submit button */}
      {showSubmit && (
        <div className="mt-6">
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

function FieldSkeleton({ 
  layout = "stacked", 
  includeHint = true 
}: { 
  layout?: "stacked" | "inline" | "grid";
  includeHint?: boolean;
}) {
  if (layout === "inline") {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24 flex-shrink-0" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
      {includeHint && <Skeleton className="h-3 w-full max-w-[250px]" />}
    </div>
  );
}

/**
 * Skeleton for a form with default fields for user registration
 */
export function RegisterFormSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <FormSkeleton 
      fields={5}
      showHeader={true}
      fieldGroups={{ indexes: [[0, 1]] }} // Group first and last name fields
      width="md"
      className={className}
      {...props}
    />
  );
}

/**
 * Skeleton for a form with default fields for user login
 */
export function LoginFormSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <FormSkeleton 
      fields={2}
      showHeader={true}
      width="sm"
      className={className}
      {...props}
    />
  );
}

/**
 * Skeleton for a settings or profile form
 */
export function SettingsFormSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <FormSkeleton 
      fields={6}
      showHeader={true}
      fieldGroups={{ indexes: [[0, 1], [2, 3]] }}
      width="lg"
      className={className}
      {...props}
    />
  );
}

/**
 * Skeleton for a search form with filters
 */
export function SearchFormSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a card with a form inside
 */
export function FormCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "border rounded-lg p-6 bg-card", 
        className
      )} 
      {...props}
    >
      <FormSkeleton 
        fields={4}
        showHeader={true}
        width="full"
      />
    </div>
  );
}