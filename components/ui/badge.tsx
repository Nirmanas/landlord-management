import { cn } from "@/lib/utils";

const styles = {
  neutral: "bg-zinc-100 text-zinc-700",
  active: "bg-emerald-100 text-emerald-800",
  upcoming: "bg-blue-100 text-blue-800",
  ended: "bg-zinc-100 text-zinc-600",
  unpaid: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-800",
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
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
