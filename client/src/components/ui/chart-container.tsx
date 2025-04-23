import React, { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, BarChart4, LineChart, PieChart, Activity, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface ChartContainerProps {
  /**
   * The title for the chart
   */
  title: string;
  /**
   * Optional description 
   */
  description?: string;
  /**
   * Children content (chart component)
   */
  children: ReactNode;
  /**
   * Whether data is still loading
   */
  isLoading?: boolean;
  /**
   * Error that occurred during data fetching
   */
  error?: Error | string | null;
  /**
   * Function to call when retry button is clicked
   */
  onRetry?: () => void;
  /**
   * Whether to show the fullscreen option
   */
  fullscreenOption?: boolean;
  /**
   * Footer content
   */
  footer?: ReactNode;
  /**
   * Optional icon to display
   */
  icon?: LucideIcon;
  /**
   * Available views for the chart
   */
  views?: { id: string; label: string; icon?: LucideIcon }[];
  /**
   * Default view to show
   */
  defaultView?: string;
  /**
   * Function called when view changes
   */
  onViewChange?: (view: string) => void;
  /**
   * Action button in the header
   */
  action?: ReactNode;
  /**
   * CSS class name
   */
  className?: string;
  /**
   * Height for the chart area
   */
  height?: string | number;
  /**
   * If data is empty (but not errored) show this message
   */
  emptyMessage?: string;
  /**
   * If data is empty, show this icon
   */
  emptyIcon?: LucideIcon;
}

/**
 * A container component for charts with consistent styling and built-in loading/error states
 */
export function ChartContainer({
  title,
  description,
  children,
  isLoading = false,
  error = null,
  onRetry,
  fullscreenOption = false,
  footer,
  icon: Icon,
  views,
  defaultView,
  onViewChange,
  action,
  className,
  height = 300,
  emptyMessage = "No data to display",
  emptyIcon: EmptyIcon = BarChart4,
}: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState(defaultView || (views?.[0]?.id || "default"));

  // Calculate the chart height
  const chartHeight = typeof height === "number" ? `${height}px` : height;

  // Handle view change
  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Format the error message
  const errorMessage = error 
    ? typeof error === "string" 
      ? error 
      : error.message || "An error occurred loading the chart data"
    : null;

  // Fullscreen styles
  const fullscreenStyles = isFullscreen
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
      }
    : {};

  return (
    <Card
      className={cn("overflow-hidden", className)}
      style={fullscreenStyles}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {views && views.length > 1 && (
            <Tabs value={activeView} onValueChange={handleViewChange} className="mr-2">
              <TabsList className="h-8">
                {views.map((view) => (
                  <TabsTrigger key={view.id} value={view.id} className="text-xs">
                    {view.icon && <view.icon className="h-3.5 w-3.5 mr-1" />}
                    {view.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          
          {action && <div className="mr-2">{action}</div>}
          
          {fullscreenOption && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>

      <CardContent 
        className="p-0" 
        style={{ height: isFullscreen ? "calc(100vh - 140px)" : chartHeight }}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-4">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Failed to load chart data</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">{errorMessage}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        ) : children ? (
          <div className="w-full h-full">{children}</div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>

      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

/**
 * A simple metric card that shows a single number with a label
 */
export function MetricCard({
  title,
  value,
  description,
  change,
  trend,
  isLoading = false,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  isLoading?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  // Colors for trend
  const trendColors = {
    up: "text-emerald-500",
    down: "text-red-500",
    neutral: "text-gray-500",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center mt-1 space-x-2">
              {trend && change && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trendColors[trend]
                  )}
                >
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {change}
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}