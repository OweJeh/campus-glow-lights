import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant: "destructive" | "success" | "default" | "warning" | "info" | "violet";
  subtitle?: string;
}

const variantStyles = {
  destructive: "border-destructive/20 bg-destructive/5",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/20 bg-warning/5",
  info: "border-blue-500/20 bg-blue-50/50",
  violet: "border-violet-500/20 bg-violet-50/50",
  default: "border-border bg-card",
};

const iconStyles = {
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  default: "bg-primary/10 text-primary",
};

const StatCard = ({ title, value, icon: Icon, variant, subtitle }: StatCardProps) => (
  <div className={`rounded-xl border p-4 ${variantStyles[variant]}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-display font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default StatCard;
