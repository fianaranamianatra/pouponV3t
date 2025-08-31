import React from 'react';
import { Search, Bell, User, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Avatar } from './Avatar';
import { logout } from '../lib/auth';
import { OfflineHandler } from '../lib/firebase/offlineHandler';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    const removeListener = OfflineHandler.addConnectionListener((online) => {
      setIsOnline(online);
    });

    return removeListener;
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Utiliser l'URL complète comme test
      window.location.href = 'https://thriving-kelpie-116aaa.netlify.app/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header className={`${isMobile ? 'h-14' : 'h-16'} bg-white border-b border-gray-200 flex items-center justify-between ${isMobile ? 'px-4' : 'px-6'}`}>
      {/* Search */}
      <div className={`flex-1 ${isMobile ? 'max-w-none' : 'max-w-md'}`}>
        <div className={`relative ${isMobile ? 'hidden sm:block' : ''}`}>
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <input
            type="text"
            placeholder="Rechercher..."
            className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        
        {/* Mobile Search Button */}
        {isMobile && (
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors sm:hidden">
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Right Actions */}
      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
        {/* Connection Status */}
        <div className={`${isMobile ? 'hidden sm:flex' : 'flex'} items-center space-x-1 px-2 py-1 rounded-full text-xs ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isOnline ? (
            <Wifi className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
          ) : (
            <WifiOff className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
          )}
          <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
        
        {/* Notifications */}
        <button className={`relative ${isMobile ? 'p-2.5' : 'p-2'} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors`}>
          <Bell className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
          <span className={`absolute top-0 right-0 ${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-red-500 rounded-full`}></span>
        </button>
        
        {/* Settings */}
        <button className={`${isMobile ? 'hidden sm:block p-2.5' : 'p-2'} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors`}>
          <Settings className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
          title="Déconnexion"
        >
          <LogOut className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
        </button>
        
        {/* User Profile */}
        <div className={`${isMobile ? 'hidden md:flex' : 'flex'} items-center space-x-3`}>
          <Avatar 
            firstName="Admin" 
            lastName="LES POUPONS" 
            size={isMobile ? "md" : "sm"}
            showPhoto={true}
          />
          <div className={`${isMobile ? 'hidden lg:block' : 'hidden md:block'}`}>
            <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-900`}>Admin LES POUPONS</p>
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}