import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The maximum width of the container (defaults to max-w-7xl)
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full" | "none";
  /**
   * Horizontal padding to apply (defaults to px-4)
   */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Center the container (defaults to true)
   */
  centered?: boolean;
  /**
   * When to apply the max width constraint
   * "always" - Apply max width at all breakpoints
   * "sm" - Apply max width only at sm and above
   * "md" - Apply max width only at md and above
   * "lg" - Apply max width only at lg and above
   * "xl" - Apply max width only at xl and above
   * "2xl" - Apply max width only at 2xl and above
   */
  breakpoint?: "always" | "sm" | "md" | "lg" | "xl" | "2xl";
}

/**
 * A responsive container component that handles proper spacing
 * and width constraints across different screen sizes.
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "7xl",
  padding = "md",
  centered = true,
  breakpoint = "always",
  ...props
}: ResponsiveContainerProps) {
  // Mapping for max width classes
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    none: "",
  };

  // Mapping for horizontal padding classes
  const paddingClasses = {
    none: "",
    xs: "px-2",
    sm: "px-3",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
  };

  // Mapping for breakpoint-specific max width classes
  const breakpointClasses = {
    always: maxWidthClasses[maxWidth],
    sm: `sm:${maxWidthClasses[maxWidth]}`,
    md: `md:${maxWidthClasses[maxWidth]}`,
    lg: `lg:${maxWidthClasses[maxWidth]}`,
    xl: `xl:${maxWidthClasses[maxWidth]}`,
    "2xl": `2xl:${maxWidthClasses[maxWidth]}`,
  };

  return (
    <div
      className={cn(
        paddingClasses[padding],
        breakpoint === "always" ? maxWidthClasses[maxWidth] : "w-full",
        breakpoint !== "always" && breakpointClasses[breakpoint],
        centered && "mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A responsive section component with consistent vertical spacing
 */
export function ResponsiveSection({
  children,
  className,
  /**
   * Vertical spacing to apply
   */
  spacing = "md",
  ...props
}: ResponsiveContainerProps & {
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}) {
  // Mapping for vertical spacing classes
  const spacingClasses = {
    none: "",
    xs: "py-2",
    sm: "py-4",
    md: "py-6",
    lg: "py-8",
    xl: "py-12",
  };

  return (
    <ResponsiveContainer
      className={cn(spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}

/**
 * A grid container that responsively adjusts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  className,
  /**
   * Gap between grid items
   */
  gap = "md",
  /**
   * Number of columns at different breakpoints
   */
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  ...props
}: Omit<ResponsiveContainerProps, "maxWidth" | "padding" | "centered" | "breakpoint"> & {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
}) {
  // Mapping for gap classes
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  // Create column classes for different breakpoints
  const colClasses = Object.entries(cols)
    .map(([breakpoint, colCount]) => {
      if (colCount <= 0) return "";
      if (breakpoint === "sm") {
        return `sm:grid-cols-${colCount}`;
      }
      return `${breakpoint}:grid-cols-${colCount}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn(
        "grid grid-cols-1",
        colClasses,
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A flex container with responsive direction
 */
export function ResponsiveFlex({
  children,
  className,
  /**
   * Flex direction with responsive options
   * Can be "row", "column", or an object with breakpoints
   */
  direction = "row",
  /**
   * Gap between flex items
   */
  gap = "md",
  /**
   * Whether to wrap items
   */
  wrap = false,
  /**
   * Alignment of items on the cross axis
   */
  align = "center",
  /**
   * Justification of items on the main axis
   */
  justify = "start",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "column" | { 
    base?: "row" | "column";
    sm?: "row" | "column";
    md?: "row" | "column";
    lg?: "row" | "column";
    xl?: "row" | "column";
  };
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  wrap?: boolean;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}) {
  // Mapping for gap classes
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  // Mapping for alignment classes
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };

  // Mapping for justification classes
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  // Handle responsive direction
  let directionClasses = "";
  if (typeof direction === "object") {
    const { base = "row", sm, md, lg, xl } = direction;
    directionClasses = `flex-${base}`;
    if (sm) directionClasses += ` sm:flex-${sm}`;
    if (md) directionClasses += ` md:flex-${md}`;
    if (lg) directionClasses += ` lg:flex-${lg}`;
    if (xl) directionClasses += ` xl:flex-${xl}`;
  } else {
    directionClasses = `flex-${direction}`;
  }

  return (
    <div
      className={cn(
        "flex",
        directionClasses,
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}