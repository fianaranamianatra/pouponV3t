import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'paid' | 'partial' | 'overdue' | 'pending' | 'critical';
  amount?: number;
  daysLate?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PaymentStatusBadge({ 
  status, 
  amount, 
  daysLate, 
  size = 'md', 
  showIcon = true 
}: PaymentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          label: 'Payé',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'partial':
        return {
          label: 'Partiel',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'overdue':
        return {
          label: 'En retard',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'critical':
        return {
          label: 'Critique',
          color: 'bg-red-200 text-red-900 border-red-300',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'pending':
      default:
        return {
          label: 'En attente',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <div className="flex flex-col items-start space-y-1">
      <span className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
        {showIcon && (
          <span className="mr-1">
            {config.icon}
          </span>
        )}
        {config.label}
      </span>
      
      {daysLate && daysLate > 0 && (
        <span className="text-xs text-red-600 font-medium">
          {daysLate} jour(s) de retard
        </span>
      )}
      
      {amount && (
        <span className="text-xs text-gray-600">
          {amount.toLocaleString()} Ar
        </span>
      )}
    </div>
  );
}