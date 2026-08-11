import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{children}</h2>;
}

export function PageTitle({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">{children}</h1>
      {badge}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs text-muted-foreground mb-1">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${className}`}
    />
  );
}

type BtnVariant = "primary" | "accent" | "ghost";
export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
  const styles: Record<BtnVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    ghost: "border border-border text-foreground hover:bg-secondary",
  };
  return (
    <button {...rest} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Tag({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70")
      }
    >
      {children}
    </button>
  );
}

export function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "positive" | "negative" | "info";
}) {
  const color =
    tone === "positive"
      ? "text-accent"
      : tone === "negative"
        ? "text-destructive"
        : tone === "info"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="flex-1 rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm">
      {children}
    </div>
  );
}
