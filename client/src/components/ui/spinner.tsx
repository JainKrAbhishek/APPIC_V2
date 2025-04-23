import React from "react";
import { cn } from "@/utils/ui-utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: "default" | "primary" | "secondary";
  label?: string;
  labelPosition?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Spinner = ({
  size = "md",
  variant = "primary",
  label,
  labelPosition = "bottom",
  className,
  ...props
}: SpinnerProps) => {
  const sizeClasses = {
    xs: "h-3 w-3 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-4",
  };

  const variantClasses = {
    default: "border-muted-foreground/30 border-t-muted-foreground/80",
    primary: "border-slate-200 dark:border-slate-700 border-t-primary",
    secondary: "border-slate-200 dark:border-slate-700 border-t-secondary",
  };

  const spinnerElement = (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );

  if (!label) {
    return spinnerElement;
  }

  const labelSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const positionClasses = {
    top: "flex-col-reverse items-center",
    bottom: "flex-col items-center",
    left: "flex-row-reverse items-center",
    right: "flex-row items-center",
  };

  const gapClasses = {
    top: "gap-2",
    bottom: "gap-2",
    left: "gap-3",
    right: "gap-3",
  };

  return (
    <div
      className={cn(
        "flex",
        positionClasses[labelPosition],
        gapClasses[labelPosition]
      )}
    >
      {spinnerElement}
      <span className={cn("text-muted-foreground", labelSizeClasses[size])}>
        {label}
      </span>
    </div>
  );
};

interface ContentLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary";
  width?: number | string;
  height?: number | string;
  animated?: boolean;
  rows?: number;
  className?: string;
}

export const ContentLoader = ({
  variant = "default",
  width,
  height,
  animated = true,
  rows = 1,
  className,
  ...props
}: ContentLoaderProps) => {
  const variantClasses = {
    default: "bg-slate-200 dark:bg-slate-800",
    primary: "bg-primary/20",
    secondary: "bg-secondary/20",
  };

  // Generate multiple rows if needed
  const renderRows = () => {
    if (rows <= 1) return null;
    
    return Array.from({ length: rows - 1 }).map((_, i) => (
      <div
        key={`content-loader-row-${i}`}
        className={cn(
          "rounded",
          variantClasses[variant],
          animated && "animate-pulse",
          "mt-2",
          i === rows - 2 && width && typeof width === 'string' ? width : "w-full",
          height ? `h-${height}` : "h-4"
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : undefined,
          height: typeof height === 'number' ? `${height}px` : undefined,
        }}
      />
    ));
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div
        className={cn(
          "rounded",
          variantClasses[variant],
          animated && "animate-pulse",
          height ? `h-${height}` : "h-4"
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : undefined,
        }}
      />
      {renderRows()}
    </div>
  );
};

export const SkeletonText = ({
  rows = 3,
  lastRowWidth = "70%",
  className,
  ...props
}: ContentLoaderProps & { lastRowWidth?: string }) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse",
            i === rows - 1 && lastRowWidth !== "100%" ? "w-[" + lastRowWidth + "]" : "w-full"
          )}
          style={{
            width: i === rows - 1 && lastRowWidth !== "100%" ? lastRowWidth : undefined,
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({
  className,
  ...props
}: ContentLoaderProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-4/5" />
      </div>
    </div>
  );
};