// ─── INPUT COMPONENT ─────────────────────────
// Reusable input with label, error display, and icon support

"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}

        {/* Input wrapper (for icon positioning) */}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input",
              icon && "pl-10",
              error && "border-error focus:border-error focus:ring-[rgba(239,68,68,0.2)]",
              className
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-xs text-error font-medium">{error}</p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
