import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
  disabled?: boolean;
}

const Portal = ({ children, container = null, disabled = false }: PortalProps) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) {
      setMountNode(null);
      return;
    }

    setMountNode(container || document.body);
  }, [container, disabled]);

  if (disabled || !mountNode) {
    return <>{children}</>;
  }

  return createPortal(children, mountNode);
};

export interface AppNotificationProps {
  /**
   * Unique ID for the notification
   */
  id: string;
  /**
   * Title of the notification
   */
  title: string;
  /**
   * Description or message (optional)
   */
  description?: string;
  /**
   * Type of notification which affects styling
   */
  type?: "success" | "error" | "warning" | "info";
  /**
   * Whether to automatically dismiss the notification
   */
  autoDismiss?: boolean;
  /**
   * How long to show the notification (in milliseconds)
   */
  duration?: number;
  /**
   * Called when the notification is dismissed
   */
  onDismiss?: (id: string) => void;
  /**
   * Action button text
   */
  actionText?: string;
  /**
   * Action button callback
   */
  onAction?: () => void;
  /**
   * Whether the notification should render in a portal
   */
  usePortal?: boolean;
  /**
   * Position of the notification
   */
  position?: "top" | "bottom" | "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * A standalone notification component that can be shown anywhere in the app
 */
export function AppNotification({
  id,
  title,
  description,
  type = "info",
  autoDismiss = true,
  duration = 5000,
  onDismiss,
  actionText,
  onAction,
  usePortal = false,
  position = "bottom-right",
  ...props
}: AppNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Set up auto-dismiss if enabled
  useEffect(() => {
    if (autoDismiss && isVisible && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, isVisible, isExiting]);

  // Handle animation end to remove from DOM
  const handleAnimationEnd = () => {
    if (isExiting) {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss(id);
      }
    }
  };

  // Handle dismiss click
  const handleDismiss = () => {
    setIsExiting(true);
  };

  // Handle action click
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleDismiss();
  };

  if (!isVisible) {
    return null;
  }

  // Determine icon based on type
  const Icon = 
    type === "success" ? CheckCircle :
    type === "error" ? AlertCircle :
    type === "warning" ? AlertTriangle :
    Info;

  // Map type to color classes
  const colorClasses = {
    success: "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50",
    error: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50",
    warning: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/50", 
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
  };

  const iconColorClasses = {
    success: "text-green-500 dark:text-green-400",
    error: "text-red-500 dark:text-red-400",
    warning: "text-yellow-500 dark:text-yellow-400",
    info: "text-blue-500 dark:text-blue-400"
  };

  const textColorClasses = {
    success: "text-green-800 dark:text-green-300",
    error: "text-red-800 dark:text-red-300",
    warning: "text-yellow-800 dark:text-yellow-300",
    info: "text-blue-800 dark:text-blue-300"
  };

  // Position classes
  const positionClasses = {
    "top": "top-0 left-1/2 -translate-x-1/2",
    "bottom": "bottom-0 left-1/2 -translate-x-1/2",
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0"
  };

  // Animation classes based on position
  const getAnimationClasses = () => {
    const base = "transition-all duration-300";
    
    if (isExiting) {
      if (position.includes("top")) {
        return `${base} -translate-y-full opacity-0`;
      } else {
        return `${base} translate-y-full opacity-0`;
      }
    }
    
    return base;
  };

  const notificationContent = (
    <div 
      className={cn(
        "fixed z-50 p-4",
        positionClasses[position],
        getAnimationClasses()
      )}
      onAnimationEnd={handleAnimationEnd}
      {...props}
    >
      <Card className={cn(
        "max-w-md overflow-hidden shadow-lg border",
        colorClasses[type]
      )}>
        <div className="p-4">
          <div className="flex gap-3">
            <div className={cn("flex-shrink-0", iconColorClasses[type])}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className={cn("text-sm font-medium", textColorClasses[type])}>
                {title}
              </h4>
              {description && (
                <p className={cn("mt-1 text-sm opacity-90", textColorClasses[type])}>
                  {description}
                </p>
              )}
              {actionText && onAction && (
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    onClick={handleAction}
                    className={cn(
                      "h-8 text-xs",
                      type === "success" && "bg-green-600 hover:bg-green-700 text-white",
                      type === "error" && "bg-red-600 hover:bg-red-700 text-white",
                      type === "warning" && "bg-yellow-600 hover:bg-yellow-700 text-white",
                      type === "info" && "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    {actionText}
                  </Button>
                </div>
              )}
            </div>
            <button
              className={cn(
                "flex-shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors", 
                textColorClasses[type]
              )}
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  return usePortal ? (
    <Portal>
      {notificationContent}
    </Portal>
  ) : notificationContent;
}

export interface NotificationBarProps {
  notifications: AppNotificationProps[];
  position?: AppNotificationProps["position"];
  spacing?: "tight" | "normal" | "loose";
  onDismiss: (id: string) => void;
}

/**
 * A notification bar component that shows multiple notifications
 */
export function NotificationBar({
  notifications,
  position = "bottom-right",
  spacing = "normal",
  onDismiss,
}: NotificationBarProps) {
  const spacingClass = {
    tight: "space-y-1",
    normal: "space-y-2",
    loose: "space-y-3"
  };

  const containerClass = cn(
    "fixed z-50 p-4 flex flex-col", 
    spacingClass[spacing],
    position === "top" && "top-0 left-1/2 -translate-x-1/2",
    position === "bottom" && "bottom-0 left-1/2 -translate-x-1/2",
    position === "top-right" && "top-0 right-0",
    position === "top-left" && "top-0 left-0",
    position === "bottom-right" && "bottom-0 right-0",
    position === "bottom-left" && "bottom-0 left-0"
  );

  return (
    <Portal>
      <div className={containerClass}>
        {notifications.map((notification) => (
          <AppNotification
            key={notification.id}
            {...notification}
            position={position}
            onDismiss={onDismiss}
            usePortal={false}
          />
        ))}
      </div>
    </Portal>
  );
}

/**
 * Simple notification for API errors
 */
export function ErrorNotification({
  error,
  onDismiss
}: {
  error: Error | string;
  onDismiss?: () => void;
}) {
  const errorMessage = typeof error === "string" ? error : error.message;
  
  return (
    <AppNotification
      id="error"
      title="Error"
      description={errorMessage}
      type="error"
      autoDismiss={true}
      duration={8000}
      onDismiss={() => onDismiss?.()}
      usePortal={true}
    />
  );
}