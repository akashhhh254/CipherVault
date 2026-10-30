import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-[#B5A27E] disabled:opacity-40 disabled:pointer-events-none cursor-pointer font-sans tracking-wide';

    const sizeStyles = {
      xs: 'text-[11px] px-2.5 py-1 gap-1.5 h-7',
      sm: 'text-xs px-3.5 py-1.5 gap-2 h-8',
      md: 'text-xs px-4 py-2 gap-2 h-9',
      lg: 'text-sm px-5 py-2.5 gap-2.5 h-10',
    };

    const variantStyles = {
      primary:
        'bg-[#B5A27E] hover:bg-[#c2ad82] text-[#090909] font-semibold border border-[#B5A27E] active:bg-[#9e8a65]',
      secondary:
        'bg-[#181818] hover:bg-[#222222] text-[#EDEDED] hover:text-white border border-[#2E2E2E] active:bg-[#111111]',
      outline:
        'bg-transparent hover:bg-[#181818] text-[#CCCCCC] hover:text-white border border-[#333333] active:bg-[#111111]',
      danger:
        'bg-[#221010] hover:bg-[#2c1414] text-red-300 border border-red-900/60 active:bg-[#1a0a0a]',
      ghost:
        'bg-transparent hover:bg-[#181818] text-[#888888] hover:text-white',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
