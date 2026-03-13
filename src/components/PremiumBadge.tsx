import { Crown } from "lucide-react";

export default function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent ${className}`}>
      <Crown className="h-3 w-3" />
      PRO
    </span>
  );
}
