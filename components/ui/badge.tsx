import { cn } from "@/lib/utils";

const styles = {
  neutral: "bg-muted text-soft-foreground",
  active: "bg-brand-surface-hover/50 text-brand-soft",
  upcoming: "bg-info-surface/40 text-info",
  ended: "bg-muted text-muted-foreground",
  unpaid: "bg-warning-surface/40 text-warning-soft",
  overdue: "bg-destructive-surface-hover/40 text-destructive-soft",
  pending: "bg-info-surface/40 text-info",
  confirmed: "bg-brand-surface-hover/50 text-brand-soft",
  failed: "bg-destructive-surface-hover/40 text-destructive-soft",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}
