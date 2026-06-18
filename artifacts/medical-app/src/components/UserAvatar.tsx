import React from 'react';
import { IonAvatar, IonIcon, IonSkeletonText } from '@ionic/react';
import { person } from 'ionicons/icons';
import { motion } from 'framer-motion';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  fallbackInitials?: string;
  isOnline?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  className = '',
  animate = true,
  fallbackInitials,
  isOnline,
}) => {
  const sizeClasses = sizeMap[size];
  const hasImage = src && src.trim() !== '';

  const getInitials = () => {
    if (fallbackInitials) return fallbackInitials;
    if (alt && alt !== 'User') {
      return alt
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
          src={src}
          alt={alt}
          className={`${sizeClasses} rounded-full object-cover ${className}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    if (fallbackInitials || (alt && alt !== 'User')) {
      return (
        <div
          className={`${sizeClasses} ${className} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold`}
        >
          {getInitials()}
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses} ${className} rounded-full bg-gray-200 flex items-center justify-center`}
      >
        <IonIcon icon={person} className="text-gray-400" />
      </div>
    );
  };

  if (animate) {
    return (
      <div className="relative inline-block">
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
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <AvatarContent />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

export default UserAvatar;
