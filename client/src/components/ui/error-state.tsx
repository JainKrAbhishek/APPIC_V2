import React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  AlertTriangle, 
  Server, 
  Database, 
  ShieldAlert, 
  RefreshCw, 
  X, 
  Wifi, 
  FileQuestion 
} from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  error?: Error | string;
  variant?: "error" | "warning" | "info" | "network" | "server" | "database" | "security" | "notFound";
  actionText?: string;
  onAction?: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
  showDismiss?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
  statusCode?: number;
}

/**
 * A component to display meaningful error states with actions
 */
export function ErrorState({
  title,
  description,
  error,
  variant = "error",
  actionText,
  onAction,
  showRetry = true,
  onRetry,
  showDismiss = false,
  onDismiss,
  compact = false,
  className,
  statusCode,
  ...props
}: ErrorStateProps) {
  // Parse error message from different error types
  const errorMessage = error
    ? typeof error === "string"
      ? error
      : error.message
    : null;

  // Set default content based on variant and status code
  const Icon = getErrorIcon(variant, statusCode);
  const defaultTitle = getDefaultErrorTitle(variant, statusCode);
  const defaultDescription = getErrorDescription(variant, errorMessage, statusCode);

  // Display values
  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;

  // Full error display in a card
  if (!compact) {
    return (
      <Card className={cn("overflow-hidden", className)} {...props}>
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-4 rounded-full p-3",
                variant === "warning"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                  : variant === "info"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-medium">{displayTitle}</h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              {displayDescription}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {showRetry && onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}

              {actionText && onAction && (
                <Button
                  size="sm"
                  variant={showRetry && onRetry ? "outline" : "default"}
                  onClick={onAction}
                >
                  {actionText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Compact version using Alert component
  return (
    <Alert
      variant="destructive"
      className={cn(
        "flex items-start",
        showDismiss && "pr-10",
        variant === "warning" && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-300",
        variant === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/50 text-blue-800 dark:text-blue-300",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4 mt-1" />
      <div className="ml-2 flex-1">
        {displayTitle && <AlertTitle>{displayTitle}</AlertTitle>}
        {displayDescription && (
          <AlertDescription className="mt-1">
            {displayDescription}
            
            {(showRetry || actionText) && (
              <div className="mt-2 flex gap-2">
                {showRetry && onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="h-7 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                
                {actionText && onAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAction}
                    className="h-7 px-2 text-xs"
                  >
                    {actionText}
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        )}
      </div>
      
      {showDismiss && onDismiss && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 h-6 w-6 rounded-full"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </Alert>
  );
}

function getErrorIcon(variant: ErrorStateProps["variant"], statusCode?: number) {
  if (statusCode) {
    if (statusCode === 404) return FileQuestion;
    if (statusCode >= 500) return Server;
    if (statusCode === 403) return ShieldAlert;
  }

  switch (variant) {
    case "warning":
      return AlertTriangle;
    case "network":
      return Wifi;
    case "server":
      return Server;
    case "database":
      return Database;
    case "security":
      return ShieldAlert;
    case "notFound":
      return FileQuestion;
    case "info":
    case "error":
    default:
      return AlertCircle;
  }
}

function getDefaultErrorTitle(variant: ErrorStateProps["variant"], statusCode?: number) {
  if (statusCode) {
    if (statusCode === 404) return "Not Found";
    if (statusCode === 403) return "Access Denied";
    if (statusCode === 401) return "Authentication Required";
    if (statusCode >= 500) return "Server Error";
    if (statusCode >= 400) return "Request Error";
  }

  switch (variant) {
    case "warning":
      return "Warning";
    case "network":
      return "Network Error";
    case "server":
      return "Server Error";
    case "database":
      return "Database Error";
    case "security":
      return "Security Error";
    case "notFound":
      return "Not Found";
    case "info":
      return "Information";
    case "error":
    default:
      return "Error Occurred";
  }
}

function getErrorDescription(
  variant: ErrorStateProps["variant"],
  errorMessage: string | null,
  statusCode?: number
) {
  if (errorMessage) return errorMessage;

  if (statusCode) {
    if (statusCode === 404) return "The requested resource could not be found.";
    if (statusCode === 403) return "You don't have permission to access this resource.";
    if (statusCode === 401) return "Please log in to access this resource.";
    if (statusCode >= 500) return "The server encountered an error processing your request.";
    if (statusCode >= 400) return "There was an error with the request.";
  }

  switch (variant) {
    case "warning":
      return "This action might cause issues or require additional steps.";
    case "network":
      return "Could not connect to the server. Please check your internet connection.";
    case "server":
      return "The server encountered an error while processing your request.";
    case "database":
      return "There was an error accessing or updating the database.";
    case "security":
      return "A security issue prevented this action from completing.";
    case "notFound":
      return "The requested resource could not be found.";
    case "info":
      return "This information may be important for your current task.";
    case "error":
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function ServerError({ 
  statusCode = 500, 
  ...props 
}: Omit<ErrorStateProps, "variant" | "statusCode"> & { statusCode?: number }) {
  return (
    <ErrorState
      variant="server"
      statusCode={statusCode}
      {...props}
    />
  );
}

export function NetworkError({
  ...props
}: Omit<ErrorStateProps, "variant">) {
  return (
    <ErrorState
      variant="network"
      {...props}
    />
  );
}

export function InlineError({
  ...props
}: ErrorStateProps) {
  return (
    <ErrorState
      compact
      {...props}
    />
  );
}