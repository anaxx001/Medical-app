import { UserRound } from "lucide-react";

/**
 * Avatar component for consistent user avatar display across the app
 * Uses UserRound icon from lucide-react as fallback instead of initials
 */

interface AvatarProps {
  avatarUrl?: string;
  fullName?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ avatarUrl, fullName = "User", size = 40 }: AvatarProps) {
  const tealGradient = "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: avatarUrl ? "transparent" : tealGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <UserRound size={Math.floor(size * 0.5)} color="#fff" strokeWidth={1.5} />
      )}
    </div>
  );
}

export default UserAvatar;
