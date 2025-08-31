import React, { useEffect, useState } from 'react';
import { Zap, Users, TrendingUp, RefreshCw, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { useEcolageSync } from '../../hooks/useEcolageSync';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { studentsService } from '../../lib/firebase/firebaseService';

interface EcolageStudentSyncProps {
  className?: string;
}

export function EcolageStudentSync({ className = '' }: EcolageStudentSyncProps) {
  const ecolageSyncData = useEcolageSync();
  const { data: students } = useFirebaseCollection(studentsService, true);
  const [syncStats, setSyncStats] = useState({
    studentsWithPayments: 0,
    studentsWithoutPayments: 0,
    averagePaymentRate: 0,
    totalSyncedRecords: 0
  });

  // Calculer les statistiques de synchronisation
  useEffect(() => {
    if (students.length > 0 && !ecolageSyncData.loading) {
      const studentsWithPayments = students.filter(student => {
        const studentName = `${student.firstName} ${student.lastName}`;
        return ecolageSyncData.recentPayments.some(p => p.studentName === studentName);
      }).length;

      const studentsWithoutPayments = students.length - studentsWithPayments;
      const averagePaymentRate = studentsWithPayments > 0 ? 
        (studentsWithPayments / students.length) * 100 : 0;

      setSyncStats({
        studentsWithPayments,
        studentsWithoutPayments,
        averagePaymentRate,
        totalSyncedRecords: ecolageSyncData.totalPayments
      });
    }
  }, [students, ecolageSyncData]);

  if (ecolageSyncData.loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-700">Synchronisation en cours...</span>
        </div>
      </div>
    );
  }

  if (ecolageSyncData.error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">Erreur de synchronisation: {ecolageSyncData.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-gray-900">Synchronisation Bidirectionnelle Active</h3>
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <RefreshCw className="w-3 h-3" />
          <span>MAJ: {ecolageSyncData.lastUpdated.toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-green-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Étudiants Synchronisés</p>
              <p className="text-lg font-bold text-green-600">{syncStats.studentsWithPayments}</p>
            </div>
            <Users className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Taux de Synchronisation</p>
              <p className="text-lg font-bold text-blue-600">{syncStats.averagePaymentRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-purple-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Paiements</p>
              <p className="text-lg font-bold text-purple-600">{ecolageSyncData.totalPayments}</p>
            </div>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white border border-orange-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Montant Total</p>
              <p className="text-lg font-bold text-orange-600">{(ecolageSyncData.totalAmount / 1000000).toFixed(1)}M Ar</p>
            </div>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-green-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-green-700 font-medium">
              ✅ Synchronisation temps réel active
            </span>
            <span className="text-gray-600">
              Profils ↔ Écolage
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Dernière synchronisation:</span>
            <span className="font-medium">{ecolageSyncData.lastUpdated.toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}