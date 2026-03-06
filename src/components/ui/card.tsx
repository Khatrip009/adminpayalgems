import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 p-0 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1 border-b border-slate-100 px-5 py-4 dark:border-slate-800",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-4 text-sm text-slate-700 dark:text-slate-200", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";
