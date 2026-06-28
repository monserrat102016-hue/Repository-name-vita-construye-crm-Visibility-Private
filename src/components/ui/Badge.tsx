import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  color?: "brand" | "green" | "red" | "yellow" | "blue" | "gray" | "stone" | "purple";
}

const colores = {
  brand:  "bg-[var(--color-brand-bg)] text-[var(--color-brand-dark)] border-[var(--color-brand-light)]",
  green:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
  red:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
  blue:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  gray:   "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  stone:  "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
};

export default function Badge({ children, className, color = "gray" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
        colores[color],
        className
      )}
    >
      {children}
    </span>
  );
}
