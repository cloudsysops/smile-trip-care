type Variant = "default" | "success" | "warning" | "danger" | "info";

type Props = Readonly<{
  label: string;
  variant?: Variant;
}>;

const CLASS_BY_VARIANT: Record<Variant, string> = {
  default: "border-zinc-700 bg-zinc-800/60 text-zinc-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-red-500/30 bg-red-500/10 text-red-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

export default function StatusBadge({ label, variant = "default" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASS_BY_VARIANT[variant]}`}>
      {label}
    </span>
  );
}
