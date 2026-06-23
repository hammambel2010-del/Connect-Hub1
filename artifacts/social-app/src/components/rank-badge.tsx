import { cn } from "@/lib/utils";
import { Crown, Shield, Star, Link2, Diamond, Video, Film } from "lucide-react";

export type Rank =
  | "admin"
  | "co_admin"
  | "advisor"
  | "well_connected"
  | "important"
  | "content_creator"
  | "hollywood"
  | "user";

interface RankConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  border: string;
  bg: string;
}

const RANK_CONFIG: Record<Rank, RankConfig | null> = {
  user: null,
  admin: {
    label: "المدير",
    icon: <Crown className="w-3 h-3" />,
    color: "text-yellow-900",
    bg: "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300",
    border: "border border-yellow-500",
    glow: "shadow-[0_0_10px_3px_rgba(251,191,36,0.7),0_0_20px_6px_rgba(251,191,36,0.4)]",
  },
  co_admin: {
    label: "شريك المدير",
    icon: <Shield className="w-3 h-3" />,
    color: "text-purple-100",
    bg: "bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600",
    border: "border border-purple-400",
    glow: "shadow-[0_0_10px_3px_rgba(147,51,234,0.7),0_0_20px_6px_rgba(147,51,234,0.4)]",
  },
  advisor: {
    label: "المستشار",
    icon: <Star className="w-3 h-3" />,
    color: "text-blue-100",
    bg: "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600",
    border: "border border-blue-400",
    glow: "shadow-[0_0_10px_3px_rgba(59,130,246,0.7),0_0_20px_6px_rgba(59,130,246,0.4)]",
  },
  well_connected: {
    label: "متصل جيداً",
    icon: <Link2 className="w-3 h-3" />,
    color: "text-cyan-100",
    bg: "bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500",
    border: "border border-cyan-400",
    glow: "shadow-[0_0_10px_3px_rgba(6,182,212,0.7),0_0_20px_6px_rgba(6,182,212,0.4)]",
  },
  important: {
    label: "ذو أهمية",
    icon: <Diamond className="w-3 h-3" />,
    color: "text-orange-100",
    bg: "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500",
    border: "border border-orange-400",
    glow: "shadow-[0_0_10px_3px_rgba(249,115,22,0.7),0_0_20px_6px_rgba(249,115,22,0.4)]",
  },
  content_creator: {
    label: "صانع محتوى",
    icon: <Video className="w-3 h-3" />,
    color: "text-green-100",
    bg: "bg-gradient-to-r from-green-600 via-emerald-500 to-green-600",
    border: "border border-green-400",
    glow: "shadow-[0_0_10px_3px_rgba(34,197,94,0.7),0_0_20px_6px_rgba(34,197,94,0.4)]",
  },
  hollywood: {
    label: "ممثل هوليوود",
    icon: <Film className="w-3 h-3" />,
    color: "text-red-100",
    bg: "bg-gradient-to-r from-red-600 via-rose-500 to-red-600",
    border: "border border-red-400",
    glow: "shadow-[0_0_10px_3px_rgba(239,68,68,0.7),0_0_20px_6px_rgba(239,68,68,0.4)]",
  },
};

interface RankBadgeProps {
  rank: Rank | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function RankBadge({ rank, size = "md", className, animate = true }: RankBadgeProps) {
  const config = RANK_CONFIG[rank as Rank];
  if (!config) return null;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1",
    lg: "text-sm px-3 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold whitespace-nowrap",
        config.bg,
        config.border,
        config.color,
        config.glow,
        sizeClasses[size],
        animate && "animate-pulse-slow",
        className,
      )}
      style={animate ? {
        animation: "rankGlow 2.5s ease-in-out infinite alternate",
      } : undefined}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export function getRankLabel(rank: string): string {
  const config = RANK_CONFIG[rank as Rank];
  return config?.label ?? "";
}

// Inject keyframe animation once
if (typeof document !== "undefined") {
  const styleId = "rank-glow-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes rankGlow {
        0% { filter: brightness(1); box-shadow: var(--glow-start); }
        100% { filter: brightness(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
}
