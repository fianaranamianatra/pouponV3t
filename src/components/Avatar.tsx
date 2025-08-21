import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showPhoto?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
};

// Fonction pour générer une couleur basée sur le nom
const getColorFromName = (firstName: string, lastName: string): string => {
  const name = `${firstName || ''}${lastName || ''}`.toLowerCase();
  const colors = [
    'from-blue-400 to-blue-500',
    'from-green-400 to-green-500',
    'from-purple-400 to-purple-500',
    'from-pink-400 to-pink-500',
    'from-indigo-400 to-indigo-500',
    'from-red-400 to-red-500',
    'from-yellow-400 to-yellow-500',
    'from-teal-400 to-teal-500',
    'from-orange-400 to-orange-500',
    'from-cyan-400 to-cyan-500',
    'from-emerald-400 to-emerald-500',
    'from-violet-400 to-violet-500',
    'from-rose-400 to-rose-500',
    'from-amber-400 to-amber-500',
    'from-lime-400 to-lime-500',
    'from-sky-400 to-sky-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Fonction pour générer une URL d'avatar réaliste
const getAvatarUrl = (firstName: string, lastName: string, seed?: string): string => {
  const seedValue = seed || `${firstName || ''}${lastName || ''}`;
  // Utilisation d'un service d'avatars générés avec fallback
  try {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedValue)}&backgroundColor=transparent`;
  } catch (error) {
    // Fallback vers initiales si le service externe échoue
    return '';
  }
};

export function Avatar({ firstName, lastName, size = 'md', className = '', showPhoto = true }: AvatarProps) {
  const initials = `${firstName && firstName[0] || ''}${lastName && lastName[0] || ''}`.toUpperCase();
  const colorClass = getColorFromName(firstName, lastName);
  const avatarUrl = getAvatarUrl(firstName, lastName);
  
  if (showPhoto) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback vers l'avatar avec initiales si l'image ne charge pas
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center">
                    <span class="text-white font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-2xl'}">${initials}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center`}>
            <span className="text-white font-medium">{initials}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center ${className}`}>
      {initials ? (
        <span className="text-white font-medium">{initials}</span>
      ) : (
        <User className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
}