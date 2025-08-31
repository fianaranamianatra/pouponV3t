import React from 'react';
import { FolderSync as Sync, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StudentSyncIndicatorProps {
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  lastSyncTime?: Date;
  className?: string;
}

export const StudentSyncIndicator: React.FC<StudentSyncIndicatorProps> = ({
  syncStatus,
  lastSyncTime,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Sync className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synchronized';
      case 'syncing':
        return 'Synchronizing...';
      case 'error':
        return 'Sync Error';
      case 'pending':
        return 'Pending Sync';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600';
      case 'syncing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastSyncTime && syncStatus === 'synced' && (
        <span className="text-xs text-gray-500">
          {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default StudentSyncIndicator;