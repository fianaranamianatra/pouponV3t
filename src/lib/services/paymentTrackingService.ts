// Service de suivi des paiements d'écolage
import { feesService, studentsService } from '../firebase/firebaseService';

export interface PaymentSummary {
  studentId: string;
  studentName: string;
  class: string;
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  remainingBalance: number;
  paymentRate: number;
  lastPaymentDate?: string;
  nextDueDate?: string;
  status: 'up_to_date' | 'partial' | 'overdue' | 'critical';
}

export interface PaymentAlert {
  studentId: string;
  studentName: string;
  class: string;
  alertType: 'overdue' | 'upcoming' | 'partial';
  amount: number;
  daysOverdue?: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export class PaymentTrackingService {
  /**
   * Obtenir le résumé des paiements pour un élève
   */
  static async getStudentPaymentSummary(studentId: string, academicYear: string = '2024-2025'): Promise<PaymentSummary | null> {
    try {
      const student = await studentsService.getById(studentId);
      if (!student) return null;

      const studentPayments = await this.getStudentPayments(student);
      const monthlyAmount = this.getMonthlyAmount(student.class);
      const totalDue = monthlyAmount * 10; // 10 mois d'école
      
      const totalPaid = studentPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalOverdue = studentPayments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
      
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
      const lastPayment = studentPayments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];

      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        class: student.class,
        totalDue,
        totalPaid,
        totalOverdue,
        remainingBalance,
        paymentRate,
        lastPaymentDate: lastPayment?.paymentDate,
        status
      };
    } catch (error) {
      console.error('Erreur lors du calcul du résumé de paiement:', error);
      return null;
    }
  }

  /**
   * Obtenir toutes les alertes de paiement
   */
  static async getPaymentAlerts(): Promise<PaymentAlert[]> {
    try {
      const allStudents = await studentsService.getAll();
      const alerts: PaymentAlert[] = [];

      for (const student of allStudents) {
        const studentPayments = await this.getStudentPayments(student);
        const monthlyAmount = this.getMonthlyAmount(student.class);
        
        // Vérifier les paiements en retard
        const overduePayments = studentPayments.filter(p => p.status === 'overdue');
        if (overduePayments.length > 0) {
          const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
          const oldestOverdue = overduePayments
            .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())[0];
          
          const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(oldestOverdue.paymentDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          alerts.push({
            studentId: student.id!,
            studentName: `${student.firstName} ${student.lastName}`,
            class: student.class,
            alertType: 'overdue',
            amount: totalOverdue,
            daysOverdue,
            dueDate: oldestOverdue.paymentDate,
            priority: daysOverdue > 60 ? 'high' : daysOverdue > 30 ? 'medium' : 'low'
          });
        }

        // Vérifier les paiements partiels
        const partialPayments = studentPayments.filter(p => p.status === 'pending' && p.amount < monthlyAmount);
        if (partialPayments.length > 0) {
          const totalPartial = partialPayments.reduce((sum, p) => sum + p.amount, 0);
          
          alerts.push({
            studentId: student.id!,
            studentName: `${student.firstName} ${student.lastName}`,
            class: student.class,
            alertType: 'partial',
            amount: totalPartial,
            dueDate: partialPayments[0].paymentDate,
            priority: 'medium'
          });
        }
      }

      return alerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      return [];
    }
  }

  /**
   * Générer un rapport de paiements pour une classe
   */
  static async generateClassPaymentReport(className: string, academicYear: string = '2024-2025'): Promise<any[]> {
    try {
      const allStudents = await studentsService.getAll();
      const classStudents = allStudents.filter(s => s.class === className);
      
      const report = [];
      
      for (const student of classStudents) {
        const summary = await this.getStudentPaymentSummary(student.id!, academicYear);
        if (summary) {
          report.push(summary);
        }
      }
      
      return report.sort((a, b) => b.totalOverdue - a.totalOverdue);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de classe:', error);
      return [];
    }
  }

  /**
   * Calculer les statistiques globales de paiement
   */
  static async calculateGlobalPaymentStats(): Promise<{
    totalStudents: number;
    totalDue: number;
    totalPaid: number;
    totalOverdue: number;
    averagePaymentRate: number;
    studentsUpToDate: number;
    studentsWithOverdue: number;
  }> {
    try {
      const allStudents = await studentsService.getAll();
      const allPayments = await feesService.getAll();
      
      let totalDue = 0;
      let totalPaid = 0;
      let totalOverdue = 0;
      let studentsUpToDate = 0;
      let studentsWithOverdue = 0;

      for (const student of allStudents) {
        const studentPayments = allPayments.filter(p => 
          p.studentName === `${student.firstName} ${student.lastName}`
        );
        
        const monthlyAmount = this.getMonthlyAmount(student.class);
        const studentTotalDue = monthlyAmount * 10;
        const studentTotalPaid = studentPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        const studentTotalOverdue = studentPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + p.amount, 0);

        totalDue += studentTotalDue;
        totalPaid += studentTotalPaid;
        totalOverdue += studentTotalOverdue;

        if (studentTotalOverdue === 0 && studentTotalPaid >= studentTotalDue) {
          studentsUpToDate++;
        } else if (studentTotalOverdue > 0) {
          studentsWithOverdue++;
        }
      }

      const averagePaymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

      return {
        totalStudents: allStudents.length,
        totalDue,
        totalPaid,
        totalOverdue,
        averagePaymentRate,
        studentsUpToDate,
        studentsWithOverdue
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques globales:', error);
      return {
        totalStudents: 0,
        totalDue: 0,
        totalPaid: 0,
        totalOverdue: 0,
        averagePaymentRate: 0,
        studentsUpToDate: 0,
        studentsWithOverdue: 0
      };
    }
  }

  /**
   * Obtenir les paiements d'un élève
   */
  private static async getStudentPayments(student: any): Promise<any[]> {
    const allPayments = await feesService.getAll();
    return allPayments.filter(p => 
      p.studentName === `${student.firstName} ${student.lastName}`
    );
  }

  /**
   * Obtenir le montant mensuel selon la classe
   */
  private static getMonthlyAmount(className: string): number {
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
  }

  /**
   * Envoyer des rappels de paiement
   */
  static async sendPaymentReminders(studentIds: string[]): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    try {
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const studentId of studentIds) {
        try {
          // Simuler l'envoi de rappel
          await new Promise(resolve => setTimeout(resolve, 100));
          sent++;
        } catch (error: any) {
          failed++;
          errors.push(`Élève ${studentId}: ${error.message}`);
        }
      }

      return { sent, failed, errors };
    } catch (error: any) {
      return {
        sent: 0,
        failed: studentIds.length,
        errors: [error.message]
      };
    }
  }

  /**
   * Exporter un rapport de paiements
   */
  static exportPaymentReport(data: PaymentSummary[], format: 'csv' | 'excel' = 'csv'): void {
    const csvContent = [
      'Élève,Classe,Total Dû,Total Payé,Solde,Taux de Paiement,Statut,Dernier Paiement',
      ...data.map(summary => [
        summary.studentName,
        summary.class,
        summary.totalDue,
        summary.totalPaid,
        summary.remainingBalance,
        `${summary.paymentRate.toFixed(1)}%`,
        summary.status === 'up_to_date' ? 'À jour' :
        summary.status === 'partial' ? 'Partiel' :
        summary.status === 'overdue' ? 'En retard' : 'Critique',
        summary.lastPaymentDate || 'Aucun'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_paiements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}