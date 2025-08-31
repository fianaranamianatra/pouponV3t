import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { useStudentPayments } from '../../hooks/useStudentPayments';

interface StudentSyncIndicatorProps {
  studentName: string;
  studentClass: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function StudentSyncIndicator({ 
  studentName, 
  studentClass, 
  size = 'sm', 
  showDetails = false 
}: StudentSyncIndicatorProps) {
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const paymentData = useStudentPayments(studentName, studentClass);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'md': return 'text-sm px-3 py-1.5';
      case 'lg': return 'text-base px-4 py-2';
      default: return 'text-xs px-2 py-1';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'md': return 'w-4 h-4';
      case 'lg': return 'w-5 h-5';
      default: return 'w-3 h-3';
    }
  };

  if (paymentData.loading) {
    return (
      <div className={`inline-flex items-center space-x-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 ${getSizeClasses()}`}>
        <div className={`border-2 border-blue-600 border-t-transparent rounded-full animate-spin ${getIconSize()}`}></div>
        <span>Synchronisation...</span>
      </div>
    );
  }

  if (paymentData.error) {
    return (
      <div className={`inline-flex items-center space-x-1 bg-red-50 text-red-700 rounded-full border border-red-200 ${getSizeClasses()}`}>
        <AlertTriangle className={getIconSize()} />
        <span>Erreur sync</span>
      </div>
    );
  }

  const getSyncStatus = () => {
    if (paymentData.payments.length === 0) {
      return {
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: <Zap className={getIconSize()} />,
        label: 'Aucun paiement'
      };
    }

    return {
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle className={getIconSize()} />,
      label: `${paymentData.payments.length} paiement(s)`
    };
  };

  const syncStatus = getSyncStatus();

  return (
    <div className="relative">
      <div className={`inline-flex items-center space-x-1 rounded-full border ${syncStatus.color} ${getSizeClasses()}`}>
        {syncStatus.icon}
        <span>{syncStatus.label}</span>
        {showDetails && (
          <button
            onClick={() => setShowSyncDetails(!showSyncDetails)}
            className="ml-1 hover:bg-white hover:bg-opacity-50 rounded-full p-0.5 transition-colors"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Details Dropdown */}
      {showSyncDetails && (
        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Synchronisation Temps Réel
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total payé:</span>
              <span className="font-medium text-green-600">{paymentData.totalPaid.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taux de paiement:</span>
              <span className="font-medium text-blue-600">{paymentData.paymentRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <span className={`font-medium ${
                paymentData.status === 'up_to_date' ? 'text-green-600' :
                paymentData.status === 'partial' ? 'text-blue-600' :
                paymentData.status === 'overdue' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {paymentData.status === 'up_to_date' ? 'À jour' :
                 paymentData.status === 'partial' ? 'Partiel' :
                 paymentData.status === 'overdue' ? 'En retard' : 'Critique'}
              </span>
            </div>
            {paymentData.lastPaymentDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Dernier paiement:</span>
                <span className="font-medium text-gray-900">
                  {new Date(paymentData.lastPaymentDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Synchronisé avec module Écolage</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowSyncDetails(false)}
            className="w-full mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}