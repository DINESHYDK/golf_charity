// ─── BUTTON COMPONENT ────────────────────────
// Reusable button with variants, sizes, loading state, and press effects
// All buttons MUST use this component — no raw <button> elements

"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-primary-dark hover:bg-accent-light shadow-btn hover:shadow-btn-hover",
  secondary:
    "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-secondary",
  ghost:
    "bg-transparent text-primary shadow-none hover:bg-primary/5",
  danger:
    "bg-error text-white hover:bg-red-600 shadow-btn hover:shadow-btn-hover",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-6 py-3 text-sm gap-2",
  lg: "px-8 py-4 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        // ─── PRESS EFFECT: scale down on click ───
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-body font-semibold",
          "rounded-btn transition-all duration-250",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {/* Left icon */}
        {!isLoading && icon && iconPosition === "left" && icon}

        {/* Button text */}
        {isLoading ? loadingText || children : children}

        {/* Right icon */}
        {!isLoading && icon && iconPosition === "right" && icon}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
