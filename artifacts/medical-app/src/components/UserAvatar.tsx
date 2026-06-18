import React from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserAvatarProps {
  src?: string | null;
  url?: string | null;  // alias for src
  alt?: string;
  username?: string;
  size?: number;
  style?: React.CSSProperties;
  animate?: boolean;
  fallbackInitials?: string;
  isOnline?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  url,
  alt = 'User',
  username = '',
  size = 40,
  style = {},
  animate = true,
  fallbackInitials,
  isOnline,
}) => {
  const avatarUrl = src || url;
  const hasImage = avatarUrl && avatarUrl.trim() !== '';

  const getInitials = () => {
    if (fallbackInitials) return fallbackInitials;
    const name = alt !== 'User' ? alt : username;
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

  const AvatarContent = () => {
    if (hasImage) {
      return (
        <img
          src={avatarUrl}
          alt={alt}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            ...style,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    if (fallbackInitials || (alt && alt !== 'User') || username) {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: size > 60 ? '18px' : size > 40 ? '14px' : '12px',
            fontFamily: 'var(--font-display)',
            ...style,
          }}
        >
          {getInitials()}
        </div>
      );
    }

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <User size={size > 60 ? 24 : size > 40 ? 18 : 14} color="var(--text-muted)" />
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  if (animate) {
    return (
      <div style={containerStyle}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AvatarContent />
        </motion.div>
        {isOnline && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: size > 60 ? '14px' : size > 40 ? '10px' : '8px',
              height: size > 60 ? '14px' : size > 40 ? '10px' : '8px',
              background: '#22C55E',
              border: '2px solid var(--surface)',
              borderRadius: '50%',
              display: 'block',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <AvatarContent />
      {isOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: size > 60 ? '14px' : size > 40 ? '10px' : '8px',
            height: size > 60 ? '14px' : size > 40 ? '10px' : '8px',
            background: '#22C55E',
            border: '2px solid var(--surface)',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
