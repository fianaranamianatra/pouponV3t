// Service étendu pour la gestion des frais avec intégration des montants par classe
import { feesService as baseFeesService } from '../firebase/firebaseService';
import { ClassEcolageService } from './classEcolageService';

export class FeesService {
  /**
   * Créer un paiement avec montant suggéré automatiquement
   */
  static async createPaymentWithSuggestion(paymentData: {
    studentName: string;
    class: string;
    paymentType?: 'monthly' | 'registration' | 'exam';
    period?: string;
    paymentMethod?: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<{
    paymentId: string;
    suggestedAmount: number;
    actualAmount: number;
    source: 'configured' | 'default';
  }> {
    try {
      // Obtenir le montant suggéré pour cette classe
      const classData = await this.getClassInfo(paymentData.class);
      const suggested = await ClassEcolageService.getSuggestedAmount(
        paymentData.class, 
        classData?.level || ''
      );

      // Déterminer le montant selon le type de paiement
      let suggestedAmount = suggested.monthlyAmount;
      if (paymentData.paymentType === 'registration') {
        suggestedAmount = suggested.registrationFee;
      } else if (paymentData.paymentType === 'exam') {
        suggestedAmount = suggested.examFee;
      }

      // Créer le paiement avec le montant suggéré
      const completePaymentData = {
        studentName: paymentData.studentName,
        class: paymentData.class,
        amount: suggestedAmount,
        paymentMethod: paymentData.paymentMethod || 'cash',
        paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
        period: paymentData.period || new Date().toLocaleDateString('fr-FR', { month: 'long' }),
        reference: paymentData.reference || `PAY-${Date.now()}`,
        status: 'paid',
        notes: paymentData.notes || `Montant automatique (${suggested.source}): ${suggestedAmount.toLocaleString()} Ar`
      };

      const paymentId = await baseFeesService.create(completePaymentData);

      console.log(`✅ Paiement créé avec montant automatique: ${suggestedAmount.toLocaleString()} Ar (${suggested.source})`);

      return {
        paymentId,
        suggestedAmount,
        actualAmount: suggestedAmount,
        source: suggested.source
      };
    } catch (error) {
      console.error('Erreur lors de la création du paiement avec suggestion:', error);
      throw error;
    }
  }

  /**
   * Obtenir les informations d'une classe
   */
  private static async getClassInfo(className: string): Promise<any> {
    try {
      // Dans une vraie implémentation, on récupérerait depuis la base de données
      // Pour l'instant, on utilise des données par défaut
      const classLevels: { [key: string]: string } = {
        'TPSA': 'Très Petite Section', 'TPSB': 'Très Petite Section',
        'PSA': 'Petite Section', 'PSB': 'Petite Section', 'PSC': 'Petite Section',
        'MS_A': 'Moyenne Section', 'MSB': 'Moyenne Section',
        'GSA': 'Grande Section', 'GSB': 'Grande Section', 'GSC': 'Grande Section',
        '11_A': 'CP', '11B': 'CP',
        '10_A': 'CE1', '10_B': 'CE1',
        '9A': 'CE2', '9_B': 'CE2',
        '8': 'CM1', '7': 'CM2',
        'CS': 'Classe Spécialisée', 'GARDERIE': 'Garderie'
      };

      return {
        name: className,
        level: classLevels[className] || 'Niveau inconnu'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de classe:', error);
      return { name: className, level: 'Niveau inconnu' };
    }
  }

  /**
   * Obtenir tous les montants configurés
   */
  static async getAllConfiguredAmounts(): Promise<any[]> {
    try {
      return await ClassEcolageService.getAllClassAmounts();
    } catch (error) {
      console.error('Erreur lors de la récupération des montants:', error);
      return [];
    }
  }

  /**
   * Valider un montant de paiement selon la classe
   */
  static async validatePaymentAmount(
    className: string, 
    amount: number, 
    paymentType: 'monthly' | 'registration' | 'exam' = 'monthly'
  ): Promise<{
    isValid: boolean;
    suggestedAmount: number;
    variance: number;
    message: string;
  }> {
    try {
      const classData = await this.getClassInfo(className);
      const suggested = await ClassEcolageService.getSuggestedAmount(className, classData.level);
      
      let expectedAmount = suggested.monthlyAmount;
      if (paymentType === 'registration') {
        expectedAmount = suggested.registrationFee;
      } else if (paymentType === 'exam') {
        expectedAmount = suggested.examFee;
      }

      const variance = Math.abs(amount - expectedAmount);
      const variancePercent = expectedAmount > 0 ? (variance / expectedAmount) * 100 : 0;
      
      // Tolérance de 10% par rapport au montant configuré
      const isValid = variancePercent <= 10;
      
      let message = '';
      if (!isValid) {
        message = `Montant inhabituel pour ${className}. Montant attendu: ${expectedAmount.toLocaleString()} Ar`;
      } else if (variance > 0) {
        message = `Montant validé (écart: ${variance.toLocaleString()} Ar)`;
      } else {
        message = 'Montant conforme à la configuration';
      }

      return {
        isValid,
        suggestedAmount: expectedAmount,
        variance,
        message
      };
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        isValid: true,
        suggestedAmount: amount,
        variance: 0,
        message: 'Validation impossible, montant accepté'
      };
    }
  }
}