import { useState, useEffect } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { feesService } from '../lib/firebase/firebaseService';

export interface StudentPaymentData {
  payments: any[];
  totalPaid: number;
  totalDue: number;
  remainingBalance: number;
  paymentRate: number;
  lastPaymentDate?: string;
  overduePayments: any[];
  status: 'up_to_date' | 'partial' | 'overdue' | 'critical';
  loading: boolean;
  error: string | null;
}

export function useStudentPayments(studentName: string, studentClass: string) {
  const [paymentData, setPaymentData] = useState<StudentPaymentData>({
    payments: [],
    totalPaid: 0,
    totalDue: 0,
    remainingBalance: 0,
    paymentRate: 0,
    overduePayments: [],
    status: 'up_to_date',
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!studentName) {
      setPaymentData(prev => ({ ...prev, loading: false }));
      return;
    }

    console.log(`🔄 Initialisation de la synchronisation temps réel pour ${studentName}`);

    // Créer une requête pour les paiements de cet élève
    const collectionRef = feesService.getCollectionRef();
    const studentQuery = query(
      collectionRef,
      where('studentName', '==', studentName),
      orderBy('paymentDate', 'desc')
    );

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      studentQuery,
      (snapshot) => {
        console.log(`📊 Mise à jour temps réel des paiements pour ${studentName}`);
        
        const payments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculer les statistiques
        const calculatedData = calculatePaymentStatistics(payments, studentClass);
        
        setPaymentData({
          ...calculatedData,
          payments,
          loading: false,
          error: null
        });

        console.log(`✅ Données de paiement mises à jour pour ${studentName}:`, {
          totalPayments: payments.length,
          totalPaid: calculatedData.totalPaid,
          status: calculatedData.status
        });
      },
      (error) => {
        console.error(`❌ Erreur de synchronisation pour ${studentName}:`, error);
        setPaymentData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    );

    return () => {
      console.log(`🔌 Déconnexion de la synchronisation pour ${studentName}`);
      unsubscribe();
    };
  }, [studentName, studentClass]);

  return paymentData;
}

// Fonction pour calculer les statistiques de paiement
function calculatePaymentStatistics(payments: any[], studentClass: string) {
  // Montant mensuel standard selon la classe
  const getMonthlyAmount = (className: string): number => {
    const classAmounts: { [key: string]: number } = {
      'TPSA': 120000, 'TPSB': 120000,
      'PSA': 130000, 'PSB': 130000, 'PSC': 130000,
      'MS_A': 140000, 'MSB': 140000,
      'GSA': 150000, 'GSB': 150000, 'GSC': 150000,
      '11_A': 160000, '11B': 160000,
      '10_A': 170000, '10_B': 170000,
      '9A': 180000, '9_B': 180000,
      '8': 190000, '7': 200000,
      'CS': 110000, 'GARDERIE': 100000
    };
    return classAmounts[className] || 150000;
  };

  const monthlyAmount = getMonthlyAmount(studentClass);
  const totalDue = monthlyAmount * 10; // 10 mois d'école

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter(p => p.status === 'overdue');
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  const remainingBalance = totalDue - totalPaid;
  const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  // Déterminer le statut
  let status: 'up_to_date' | 'partial' | 'overdue' | 'critical' = 'up_to_date';
  if (totalOverdue > 0) {
    status = totalOverdue > monthlyAmount * 2 ? 'critical' : 'overdue';
  } else if (remainingBalance > 0) {
    status = 'partial';
  }

  // Dernière date de paiement
  const lastPayment = payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];

  return {
    totalPaid,
    totalDue,
    remainingBalance,
    paymentRate,
    lastPaymentDate: lastPayment?.paymentDate,
    overduePayments,
    status
  };
}