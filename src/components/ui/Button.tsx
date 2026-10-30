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
      'inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-normal rounded-md';

    const sizeStyles = {
      xs: 'text-xs px-2.5 py-1 gap-1.5 h-7',
      sm: 'text-xs px-3.5 py-1.5 gap-2 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-sm px-5 py-2.5 gap-2.5 h-10 font-semibold',
    };

    const variantStyles = {
      primary:
        'bg-[#111111] hover:bg-black text-white border border-[#111111] shadow-xs active:bg-[#222222]',
      secondary:
        'bg-white hover:bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5] shadow-xs active:bg-[#EEEEEE]',
      outline:
        'bg-transparent hover:bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5] active:bg-[#EEEEEE]',
      danger:
        'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] active:bg-[#FCA5A5]',
      ghost:
        'bg-transparent hover:bg-[#F7F7F7] text-[#666666] hover:text-[#111111]',
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
