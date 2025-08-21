import React from 'react';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { Avatar } from './Avatar';
import { logout } from '../lib/auth';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {/* Settings */}
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5" />
        </button>
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar 
            firstName="Admin" 
            lastName="LES POUPONS" 
            size="sm" 
            showPhoto={true}
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">Admin LES POUPONS</p>
            <p className="text-xs text-gray-500">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}