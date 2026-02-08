import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  AlertTriangle,
} from "lucide-react";

export type RecordingStatus =
  | "PENDING"
  | "ASKING_TO_JOIN"
  | "JOINED"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT";

interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  icon: any;
  animate?: boolean;
  animationClass?: string;
}

export function getMeetingStatus(status: string): StatusConfig {
  const normalizedStatus = status as RecordingStatus;

  switch (normalizedStatus) {
    case "PENDING":
      return {
        label: "Initializing",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-amber-700/80",
        borderClass: "border-amber-500/10",
        dotClass: "bg-amber-400",
        icon: Loader2,
        animationClass: "animate-spin",
      };
    case "ASKING_TO_JOIN":
      return {
        label: "Asking to Join",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-yellow-700/80",
        borderClass: "border-yellow-500/10",
        dotClass: "bg-yellow-500",
        icon: Clock,
        animationClass: "animate-pulse",
      };
    case "JOINED":
      return {
        label: "Live in Meeting",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-indigo-700/80",
        borderClass: "border-indigo-500/10",
        dotClass: "bg-indigo-500",
        icon: Video,
      };
    case "COMPLETED":
      return {
        label: "Completed",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-emerald-700/80",
        borderClass: "border-emerald-500/10",
        dotClass: "bg-emerald-500",
        icon: CheckCircle2,
      };
    case "FAILED":
      return {
        label: "Failed to Join",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-red-700/80",
        borderClass: "border-red-500/10",
        dotClass: "bg-red-500",
        icon: AlertCircle,
      };
    case "TIMEOUT":
      return {
        label: "Timed Out",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-orange-700/80",
        borderClass: "border-orange-500/10",
        dotClass: "bg-orange-500",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Unknown Status",
        bgClass: "bg-text-50",
        textClass: "text-text-500",
        borderClass: "border-text-100",
        dotClass: "bg-text-400",
        icon: Loader2,
      };
  }
}

export function getFeatureStatus(status: string): StatusConfig {
  const normalizedStatus = status as "PENDING" | "COMPLETED" | "FAILED";

  switch (normalizedStatus) {
    case "PENDING":
      return {
        label: "Processing",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-amber-700/80",
        borderClass: "border-amber-500/10",
        dotClass: "bg-amber-500",
        icon: Loader2,
        animationClass: "animate-spin",
      };
    case "COMPLETED":
      return {
        label: "Ready",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-emerald-700/80",
        borderClass: "border-emerald-500/10",
        dotClass: "bg-emerald-500",
        icon: CheckCircle2,
      };
    case "FAILED":
      return {
        label: "Failed",
        bgClass: "bg-white/40 backdrop-blur-md",
        textClass: "text-red-700/80",
        borderClass: "border-red-500/10",
        dotClass: "bg-red-500",
        icon: AlertCircle,
      };
    default:
      return {
        label: "Unknown",
        bgClass: "bg-text-50",
        textClass: "text-text-500",
        borderClass: "border-text-100",
        dotClass: "bg-text-400",
        icon: Loader2,
      };
  }
}
