import React, { Component, ReactNode, ErrorInfo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Home, RefreshCw, AlertTriangle, XCircle, Bug, Code } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  showResetButton?: boolean;
  showHomeButton?: boolean;
  showErrorDetails?: boolean;
  logToConsole?: boolean;
  variant?: "default" | "compact" | "card" | "full-page";
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with the error info for stack trace display
    this.setState({ errorInfo });

    // Log to console if enabled (default is true)
    if (this.props.logToConsole !== false) {
      console.error("Error caught by ErrorBoundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Call the error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if props change and resetOnPropsChange is true
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  renderDefaultErrorUI() {
    const { variant = "default", className, showResetButton = true, showHomeButton = false, showErrorDetails = true } = this.props;
    const { error, errorInfo } = this.state;

    // Compact inline error
    if (variant === "compact") {
      return (
        <div className={cn("rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4", className)}>
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Component Error
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error?.message || "An unexpected error occurred"}
              </div>

              {showResetButton && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={this.resetError} 
                  className="mt-3 bg-white dark:bg-red-950/50 text-red-700 dark:text-red-200 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Card-style error
    if (variant === "card") {
      return (
        <Card className={cn("border-red-200 dark:border-red-900/50", className)}>
          <CardHeader className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50">
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Component Error
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-300 font-medium mb-4">
              {error?.message || "An unexpected error occurred."}
            </p>
            
            {showErrorDetails && errorInfo && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="error-details" className="border-red-200 dark:border-red-900/30">
                  <AccordionTrigger className="text-sm text-red-700 dark:text-red-300">
                    <span className="flex items-center">
                      <Bug className="mr-2 h-4 w-4" />
                      Error Details
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-100 dark:border-red-900/30 overflow-auto max-h-40 text-red-800 dark:text-red-300">
                      {errorInfo.componentStack}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 pt-3">
            {showResetButton && (
              <Button 
                size="sm" 
                onClick={this.resetError}
                variant="outline"
                className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                size="sm" 
                variant="outline" 
                asChild
                className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Link href="/">
                  <Home className="mr-2 h-3 w-3" />
                  Home
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      );
    }

    // Full-page error
    if (variant === "full-page") {
      return (
        <div className={cn("min-h-[60vh] flex items-center justify-center p-4", className)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-lg rounded-lg overflow-hidden border border-red-200 dark:border-red-900/50">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                Something Went Wrong
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-6">
                {error?.message || "An unexpected error has occurred in this component."}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {showResetButton && (
                  <Button onClick={this.resetError} className="bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 text-white">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
                
                {showHomeButton && (
                  <Button variant="outline" asChild className="mt-2 sm:mt-0 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Go to Home
                    </Link>
                  </Button>
                )}
              </div>
              
              {showErrorDetails && errorInfo && (
                <div className="mt-6 text-left">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="error-details" className="border-red-200 dark:border-red-900/30">
                      <AccordionTrigger className="text-sm text-red-700 dark:text-red-300">
                        <span className="flex items-center">
                          <Code className="mr-2 h-4 w-4" />
                          Technical Details
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-100 dark:border-red-900/30 overflow-auto max-h-40 text-red-800 dark:text-red-300">
                          {errorInfo.componentStack}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default error UI using ErrorState component
    return (
      <div className={cn("p-6 max-w-md mx-auto", className)}>
        <ErrorState
          title="Component Error"
          description={error?.message || "We've encountered an unexpected error in this component."}
          error={error || undefined}
          variant="error"
          className="mb-4"
          showRetry={showResetButton}
          onRetry={this.resetError}
        />
        
        {showErrorDetails && errorInfo && (
          <div className="mt-4 border rounded-md p-3 bg-muted/30">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Error Details
            </h4>
            <pre className="text-xs overflow-auto bg-muted p-2 rounded max-h-40">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}
        
        {showHomeButton && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // If a function fallback is provided, use it
      if (typeof fallback === 'function' && error) {
        return fallback(error, this.resetError);
      }
      
      // If a component fallback is provided, use it
      if (fallback && typeof fallback !== 'function') {
        return fallback;
      }

      // Otherwise use our default error UI
      return this.renderDefaultErrorUI();
    }

    return children;
  }
}

/**
 * A hook to use for simpler error boundaries in function components
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const showBoundary = (error: Error) => {
    setError(error);
  };

  const resetBoundary = () => {
    setError(null);
  };

  return {
    error,
    showBoundary,
    resetBoundary
  };
}

/**
 * A component error boundary for specific sections of the app
 */
export function ComponentErrorBoundary({
  children,
  title = "Error Loading Component",
  description = "We couldn't load this component properly.",
  showReset = true,
  variant = "compact",
  className,
  ...props
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  showReset?: boolean;
  variant?: "default" | "compact" | "card";
  className?: string;
} & Omit<ErrorBoundaryProps, 'variant'>) {
  return (
    <ErrorBoundary
      variant={variant}
      showResetButton={showReset}
      showErrorDetails={false}
      className={className}
      fallback={(error) => (
        <div className={cn(
          "rounded-md border p-4", 
          variant === "compact" ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50" : "", 
          className
        )}>
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {title}
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                {description}
              </div>

              {showReset && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="mt-3 bg-white dark:bg-red-950/50 text-red-700 dark:text-red-200 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Reload Page
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * For wrapping async components in suspense boundaries
 */
export function AsyncBoundary({
  children,
  fallback,
  errorFallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
  errorFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}) {
  return (
    <ErrorBoundary
      fallback={errorFallback}
      variant="compact"
    >
      <React.Suspense fallback={fallback}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

/**
 * A version of error boundary that wraps a child function component that can access
 * the error state and reset function
 */
export function FunctionErrorBoundary({
  children,
  fallback,
  onReset,
}: {
  children: (props: { error: Error | null; reset: () => void }) => ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}) {
  const { error, resetBoundary } = useErrorBoundary();
  
  const handleReset = () => {
    resetBoundary();
    if (onReset) {
      onReset();
    }
  };
  
  if (error) {
    return fallback || <ErrorState error={error} onRetry={handleReset} />;
  }
  
  return <>{children({ error, reset: handleReset })}</>;
}

export default ErrorBoundary;