import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function UserAvatar({ src, fallback, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-24 w-24",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary uppercase">
        {fallback.substring(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}
