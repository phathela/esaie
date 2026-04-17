import * as React from "react";

type Variant = "default" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<Variant, string> = {
      default: "bg-slate-900 text-white hover:bg-slate-800",
      outline:
        "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
      ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
      destructive: "bg-red-600 text-white hover:bg-red-700"
    };
    const sizes: Record<Size, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-11 px-6"
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
