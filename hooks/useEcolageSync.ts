import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { feesService } from '../lib/firebase/firebaseService';

export interface EcolageSyncData {
  totalPayments: number;
  totalAmount: number;
  recentPayments: any[];
  paymentsByClass: { [className: string]: number };
  paymentsByStatus: { [status: string]: number };
  lastUpdated: Date;
  loading: boolean;
  error: string | null;
}

export function useEcolageSync() {
  const [syncData, setSyncData] = useState<EcolageSyncData>({
    totalPayments: 0,
    totalAmount: 0,
    recentPayments: [],
    paymentsByClass: {},
    paymentsByStatus: {},
    lastUpdated: new Date(),
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('🔄 Initialisation de la synchronisation globale Écolage');

    // Initialiser avec des valeurs par défaut
    setSyncData({
      totalPayments: 0,
      totalAmount: 0,
      recentPayments: [],
      paymentsByClass: {},
      paymentsByStatus: {},
      lastUpdated: new Date(),
      loading: true,
      error: null
    });
    // Écouter tous les changements dans la collection fees
    const collectionRef = feesService.getCollectionRef();
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.log('📊 Mise à jour globale des données d\'écolage');
        
        const allPayments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculer les statistiques globales
        const totalPayments = allPayments.length;
        const totalAmount = allPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        // Paiements récents (derniers 10)
        const recentPayments = allPayments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 10);

        // Répartition par classe
        const paymentsByClass: { [className: string]: number } = {};
        allPayments.forEach(payment => {
          if (payment.status === 'paid') {
            paymentsByClass[payment.class] = (paymentsByClass[payment.class] || 0) + payment.amount;
          }
        });

        // Répartition par statut
        const paymentsByStatus: { [status: string]: number } = {};
        allPayments.forEach(payment => {
          paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
        });

        setSyncData({
          totalPayments,
          totalAmount,
          recentPayments,
          paymentsByClass,
          paymentsByStatus,
          lastUpdated: new Date(),
          loading: false,
          error: null
        });

        console.log('✅ Synchronisation globale Écolage mise à jour:', {
          totalPayments,
          totalAmount,
          classesCount: Object.keys(paymentsByClass).length
        });
      },
      (error) => {
        console.error('❌ Erreur de synchronisation globale Écolage:', error);
        setSyncData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    );

    return () => {
      console.log('🔌 Déconnexion de la synchronisation globale Écolage');
      unsubscribe();
    };
  }, []);

  return syncData;
}