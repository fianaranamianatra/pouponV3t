import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'max-w-full mx-4' : 'max-w-md',
    md: isMobile ? 'max-w-full mx-4' : 'max-w-lg',
    lg: isMobile ? 'max-w-full mx-4' : 'max-w-2xl',
    xl: isMobile ? 'max-w-full mx-4' : 'max-w-4xl'
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMobile ? 'p-2' : 'p-4'}`}>
      <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-xl w-full ${sizeClasses[size]} ${isMobile ? 'max-h-[95vh]' : 'max-h-[90vh]'} overflow-y-auto`}>
        <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-gray-200`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{title}</h2>
          <button
            onClick={onClose}
            className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors`}
          >
            <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
          </button>
        </div>
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}