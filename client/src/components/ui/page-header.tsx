import React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { Button } from "./button";
import { Link } from "wouter";
import { Separator } from "./separator";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional description or subtitle
   */
  description?: string;
  /**
   * Actions to display in the header
   */
  actions?: React.ReactNode;
  /**
   * Whether to show a back button
   */
  showBackButton?: boolean;
  /**
   * Where the back button should navigate to
   */
  backButtonLink?: string;
  /**
   * Callback for the back button (overrides backButtonLink)
   */
  onBack?: () => void;
  /**
   * Icon to display next to the title
   */
  icon?: React.ReactNode;
  /**
   * Breadcrumbs for navigation
   */
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  /**
   * Whether to add a divider below the header
   */
  divider?: boolean;
  /**
   * Background style
   */
  background?: "none" | "light" | "solid" | "gradient";
  /**
   * Amount of vertical padding
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Whether to center the content
   */
  centered?: boolean;
}

/**
 * A consistent page header component for use across different pages
 */
export function PageHeader({
  title,
  description,
  actions,
  showBackButton = false,
  backButtonLink,
  onBack,
  icon,
  breadcrumbs,
  divider = false,
  background = "none",
  padding = "md",
  centered = false,
  className,
  ...props
}: PageHeaderProps) {
  // Handler for back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
    // If no onBack provided and no backButtonLink, default to window history
    else if (!backButtonLink) {
      window.history.back();
    }
  };

  // Determine padding classes
  const paddingClasses = {
    none: "py-0",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
  };

  // Determine background classes
  const backgroundClasses = {
    none: "",
    light: "bg-muted/30",
    solid: "bg-muted",
    gradient: "bg-gradient-to-b from-muted/50 to-transparent",
  };

  return (
    <div className={cn("w-full", backgroundClasses[background], className)} {...props}>
      <div className={cn("w-full", paddingClasses[padding])}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-2 flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-1">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className={cn(
          "flex items-start justify-between gap-4",
          centered && "flex-col items-center text-center",
          centered && actions && "sm:flex-row sm:justify-between sm:items-start sm:text-left w-full",
        )}>
          <div className={cn("flex min-w-0", centered ? "flex-col items-center" : "items-center")}>
            {/* Back button */}
            {showBackButton && (
              <div className={cn("mr-2", centered && "mb-2 mr-0")}>
                {backButtonLink ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8 rounded-full"
                  >
                    <Link href={backButtonLink}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Back</span>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackClick}
                    className="h-8 w-8 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Button>
                )}
              </div>
            )}

            {/* Icon */}
            {icon && (
              <div className={cn("mr-2", centered && "mb-2 mr-0")}>
                {icon}
              </div>
            )}

            {/* Title and description */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className={cn(
              "flex items-center gap-2 ml-auto",
              centered && "mt-4 sm:mt-0"
            )}>
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Optional divider */}
      {divider && <Separator className="mt-4" />}
    </div>
  );
}

/**
 * A header with section title styling for use inside content areas
 */
export function SectionHeader({
  title,
  description,
  actions,
  className,
  ...props
}: Omit<PageHeaderProps, "showBackButton" | "backButtonLink" | "onBack" | "icon" | "breadcrumbs" | "divider" | "background" | "padding" | "centered">) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/**
 * A large hero-style header with a gradient background
 */
export function HeroHeader({
  title,
  description,
  actions,
  className,
  ...props
}: Omit<PageHeaderProps, "showBackButton" | "backButtonLink" | "onBack" | "icon" | "breadcrumbs" | "divider" | "background" | "padding" | "centered">) {
  return (
    <div className={cn(
      "py-12 px-4 text-center bg-gradient-to-b from-primary/10 to-muted/5 rounded-lg mb-8",
      className
    )} {...props}>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
        {title}
      </h1>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground max-w-prose mx-auto">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {actions}
        </div>
      )}
    </div>
  );
}