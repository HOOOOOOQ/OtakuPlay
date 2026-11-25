import React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface/95 p-5 shadow-violet transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary-surface text-text-primary border border-border hover:border-primary/60',
    ghost: 'bg-transparent text-text-secondary hover:bg-secondary-surface hover:text-white',
    danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
    success: 'bg-success/15 text-success border border-success/40 hover:bg-success/25',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2 text-sm rounded-xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}) {
  const tones = {
    default: 'bg-secondary-surface text-text-secondary border-border',
    primary: 'bg-primary/15 text-secondary border-primary/40',
    success: 'bg-success/15 text-success border-success/40',
    danger: 'bg-danger/15 text-danger border-danger/40',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-border bg-secondary-surface px-3.5 py-2.5 text-sm text-white placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        className
      )}
      {...props}
    />
  );
}
