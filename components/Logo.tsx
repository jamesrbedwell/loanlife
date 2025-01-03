import { DollarSign } from "lucide-react";

interface LogoProps {
  variant?: "default" | "white";
}

export function Logo({ variant = "default" }: LogoProps) {
  const textColor = variant === "white" ? "text-white" : "text-primary";
  const iconColor = variant === "white" ? "text-primary" : "text-white";
  const bgColor = variant === "white" ? "bg-white" : "bg-primary";

  return (
    <div className="flex items-center gap-2">
      <div className={`${bgColor} rounded-full p-1`}>
        <DollarSign className={`h-6 w-6 ${iconColor}`} />
      </div>
      <span className={`${textColor} text-xl font-semibold`}>LOANLIFE</span>
    </div>
  );
}
