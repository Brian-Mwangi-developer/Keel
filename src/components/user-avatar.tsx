import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Generated, deterministic per-user avatar via Vercel's avatar service —
 * used as the fallback whenever a user has no uploaded profile image.
 * https://avatar.vercel.sh/
 */
function generatedAvatarUrl(seed: string) {
  return `https://avatar.vercel.sh/${encodeURIComponent(seed)}`;
}

export function UserAvatar({
  user,
  size,
  className,
}: {
  user: { id: string; name: string; image?: string | null };
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={cn("bg-muted", className)}>
      <AvatarImage src={user.image ?? generatedAvatarUrl(user.id)} alt={user.name} />
      <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
    </Avatar>
  );
}
