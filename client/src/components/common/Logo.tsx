import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  textColor?: string;
  hoverEffect?: "none" | "rotate" | "scale" | "glow" | "pulse";
  className?: string;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  customTextStyles?: string;
  withBackground?: boolean;
  backgroundStyle?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 40,
  color = "text-primary",
  showText = true,
  textColor = "text-gray-900 dark:text-white",
  hoverEffect = "none",
  className = "",
  textSize = "xl",
  customTextStyles = "",
  withBackground = false,
  backgroundStyle = "bg-primary/10 rounded-xl p-1",
}) => {
  // Define logo CSS classes based on props
  const logoClasses = cn(
    "inline-block",
    {
      "transition-transform duration-300 group-hover:rotate-12": hoverEffect === "rotate",
      "transition-transform duration-300 group-hover:scale-110": hoverEffect === "scale",
      "transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(var(--color-primary-rgb),0.7)]": hoverEffect === "glow",
      "animate-pulse": hoverEffect === "pulse"
    }
  );

  const textClasses = cn(
    `font-bold ${textColor}`,
    {
      "text-xs": textSize === "xs",
      "text-sm": textSize === "sm",
      "text-base": textSize === "base",
      "text-lg": textSize === "lg",
      "text-xl": textSize === "xl",
      "text-2xl": textSize === "2xl"
    },
    customTextStyles
  );

  const logoSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={logoClasses}
    >
      {/* Graduation Cap Base */}
      <path
        d="M24 6L4 16L24 26L44 16L24 6Z"
        className={`${color} fill-current`}
        fillOpacity="0.9"
      />

      {/* Tassel */}
      <path
        d="M14 19V32C14 32 19 38 24 38C29 38 34 32 34 32V19"
        className={`${color} fill-current`}
        fillOpacity="0.7"
      />

      {/* Cap Top */}
      <path
        d="M20 24V34C20 34 22 36 24 36C26 36 28 34 28 34V24"
        className={`${color} fill-current`}
        fillOpacity="0.8"
      />

      {/* Graduation Cap Details */}
      <path
        d="M24 26C26.2091 26 28 24.2091 28 22C28 19.7909 26.2091 18 24 18C21.7909 18 20 19.7909 20 22C20 24.2091 21.7909 26 24 26Z"
        className={`${color} fill-current`}
        fillOpacity="1"
      />
    </svg>
  );

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {withBackground ? (
        <div className={backgroundStyle}>
          {logoSvg}
        </div>
      ) : (
        logoSvg
      )}

      {showText && (
        <span className={textClasses}>PrepJet</span>
      )}
    </div>
  );
};

export default Logo;