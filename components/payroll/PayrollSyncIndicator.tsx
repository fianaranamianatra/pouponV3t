// Indicateur de synchronisation pour un employé spécifique
import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, AlertTriangle, RefreshCw, Calculator, Eye } from 'lucide-react';
import { PayrollSalarySyncService } from '../../lib/services/payrollSalarySync';

interface PayrollSyncIndicatorProps {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  className?: string;
}

export function PayrollSyncIndicator({ 
  employeeId, 
  employeeName, 
  currentSalary, 
  className = '' 
}: PayrollSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'pending'>('pending');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Écouter les événements de synchronisation pour cet employé
    const handleSyncEvent = (event: CustomEvent) => {
      if (event.detail.employeeId === employeeId) {
        setSyncStatus('synced');
        setLastSyncTime(new Date(event.detail.syncTime));
        setPayrollData(event.detail.payrollCalculation);
      }
    };

    const handleSyncError = (event: CustomEvent) => {
      if (event.detail.employeeId === employeeId) {
        setSyncStatus('error');
      }
    };

    window.addEventListener('payrollSalarySync', handleSyncEvent as EventListener);
    window.addEventListener('hierarchySalarySync', handleSyncEvent as EventListener);
    window.addEventListener('payrollSyncError', handleSyncError as EventListener);

    // Vérifier le statut initial
    checkInitialStatus();

    return () => {
      window.removeEventListener('payrollSalarySync', handleSyncEvent as EventListener);
      window.removeEventListener('hierarchySalarySync', handleSyncEvent as EventListener);
      window.removeEventListener('payrollSyncError', handleSyncError as EventListener);
    };
  }, [employeeId]);

  const checkInitialStatus = () => {
    const globalStatus = PayrollSalarySyncService.getSyncStatus();
    if (globalStatus.isActive) {
      setSyncStatus('synced');
      setLastSyncTime(globalStatus.lastSyncTime);
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      await PayrollSalarySyncService.syncSpecificEmployee(employeeId);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      setSyncStatus('error');
      console.error('Erreur lors de la synchronisation manuelle:', error);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Link2 className="w-4 h-4 text-gray-400" />;
      default:
        return <Link2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synchronisé';
      case 'syncing':
        return 'Synchronisation...';
      case 'error':
        return 'Erreur';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
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
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {lastSyncTime && syncStatus === 'synced' && (
        <span className="text-xs text-gray-500">
          {lastSyncTime.toLocaleTimeString('fr-FR')}
        </span>
      )}

      {syncStatus === 'error' && (
        <button
          onClick={handleManualSync}
          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          title="Resynchroniser"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}

      {payrollData && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          title="Voir les détails"
        >
          <Eye className="w-3 h-3" />
        </button>
      )}

      {/* Details Dropdown */}
      {showDetails && payrollData && (
        <div className="absolute z-10 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Calcul de Paie Synchronisé
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Salaire brut:</span>
              <span className="font-medium">{payrollData.grossSalary.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CNAPS:</span>
              <span className="text-red-600">-{payrollData.cnaps.employeeContribution.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OSTIE:</span>
              <span className="text-red-600">-{payrollData.ostie.employeeContribution.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IRSA:</span>
              <span className="text-red-600">-{payrollData.irsa.montant.toLocaleString()} Ar</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Salaire net:</span>
                <span className="font-bold text-green-600">{payrollData.netSalary.toLocaleString()} Ar</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(false)}
            className="w-full mt-3 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}