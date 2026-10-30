import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono tracking-wider uppercase text-[#B5A27E]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#666666] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full border bg-[#0D0D0D] px-3.5 py-2 text-xs text-[#EDEDED] placeholder-[#555555] transition-colors outline-none font-mono ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error
                ? 'border-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-[#262626] hover:border-[#383838] focus:border-[#B5A27E] focus:ring-1 focus:ring-[#B5A27E]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#666666]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-[#666666] font-mono">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
