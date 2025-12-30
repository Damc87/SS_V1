import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const variantStyles = {
  default: 'bg-slate-900 text-white shadow-soft hover:shadow-card',
  primary: 'bg-primary text-primary-foreground shadow-soft hover:shadow-card',
  secondary: 'bg-white text-slate-900 border border-border hover:-translate-y-[1px] shadow-soft/40',
  outline: 'border border-border bg-transparent text-slate-900 hover:bg-white',
  ghost: 'text-slate-700 hover:bg-muted/80',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
