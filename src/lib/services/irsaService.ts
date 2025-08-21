// Service de calcul IRSA (Impôt sur les Revenus Salariaux et Assimilés)
// Selon la réglementation fiscale malgache 2024

export interface IRSACalculation {
  salaireImposable: number;
  tranches: Array<{
    min: number;
    max: number;
    taux: number;
    montantTranche: number;
    impotTranche: number;
  }>;
  montantTotal: number;
  tauxEffectif: number;
}

export interface IRSABareme {
  tranches: Array<{
    min: number;
    max: number | null; // null pour la dernière tranche (illimitée)
    taux: number;
    description: string;
  }>;
  abattementBase: number;
  isActive: boolean;
}

export class IRSAService {
  // Barème IRSA Madagascar 2024
  private static readonly BAREME_IRSA: IRSABareme = {
    tranches: [
      { min: 0, max: 350000, taux: 0, description: "Exonéré" },
      { min: 350001, max: 400000, taux: 5, description: "5%" },
      { min: 400001, max: 500000, taux: 10, description: "10%" },
      { min: 500001, max: 600000, taux: 15, description: "15%" },
      { min: 600001, max: null, taux: 20, description: "20%" }
    ],
    abattementBase: 0, // Pas d'abattement de base actuellement
    isActive: true
  };

  /**
   * Calcule l'IRSA selon le barème progressif malgache
   * @param salaireImposable Salaire après déduction CNAPS et OSTIE
   * @returns Calcul détaillé de l'IRSA
   */
  static calculerIRSA(salaireImposable: number): IRSACalculation {
    console.log(`🧮 Calcul IRSA pour salaire imposable: ${salaireImposable.toLocaleString()} MGA`);
    
    if (salaireImposable <= 0) {
      return {
        salaireImposable: 0,
        tranches: [],
        montantTotal: 0,
        tauxEffectif: 0
      };
    }

    const tranches = [];
    let montantTotal = 0;
    let salaireRestant = salaireImposable;

    // Parcourir chaque tranche du barème
    for (const tranche of this.BAREME_IRSA.tranches) {
      if (salaireRestant <= 0) break;

      const montantTranche = this.calculerMontantTranche(salaireRestant, tranche);
      const impotTranche = Math.round(montantTranche * tranche.taux / 100);

      if (montantTranche > 0) {
        tranches.push({
          min: tranche.min,
          max: tranche.max || salaireImposable, // Pour la dernière tranche
          taux: tranche.taux,
          montantTranche,
          impotTranche
        });

        montantTotal += impotTranche;
        salaireRestant -= montantTranche;
      }
    }

    const tauxEffectif = salaireImposable > 0 ? (montantTotal / salaireImposable) * 100 : 0;

    console.log(`✅ IRSA calculé: ${montantTotal.toLocaleString()} MGA (taux effectif: ${tauxEffectif.toFixed(2)}%)`);

    return {
      salaireImposable,
      tranches,
      montantTotal: Math.round(montantTotal),
      tauxEffectif: Math.round(tauxEffectif * 100) / 100
    };
  }

  /**
   * Calcule le montant imposable dans une tranche donnée
   */
  private static calculerMontantTranche(salaireRestant: number, tranche: any): number {
    const minTranche = tranche.min;
    const maxTranche = tranche.max;

    if (salaireRestant <= 0) return 0;

    // Si pas de maximum (dernière tranche), prendre tout le salaire restant
    if (maxTranche === null) {
      return Math.max(0, salaireRestant - Math.max(0, minTranche - (salaireRestant - salaireRestant + minTranche)));
    }

    // Calculer la portion dans cette tranche
    const debutTranche = Math.max(minTranche, 0);
    const finTranche = maxTranche;
    const largeurTranche = finTranche - debutTranche + 1;

    if (salaireRestant + (salaireRestant - salaireRestant) <= debutTranche) {
      return 0;
    }

    const montantDansTranche = Math.min(salaireRestant, finTranche) - Math.max(0, debutTranche - 1);
    return Math.max(0, montantDansTranche);
  }

  /**
   * Obtient le barème IRSA actuel
   */
  static getBareme(): IRSABareme {
    return this.BAREME_IRSA;
  }

  /**
   * Formate l'affichage du calcul IRSA
   */
  static formaterCalcul(calculation: IRSACalculation): string {
    let result = `Calcul IRSA détaillé:\n`;
    result += `Salaire imposable: ${calculation.salaireImposable.toLocaleString()} MGA\n\n`;

    calculation.tranches.forEach((tranche, index) => {
      const maxDisplay = tranche.max === calculation.salaireImposable ? '∞' : tranche.max.toLocaleString();
      result += `Tranche ${index + 1}: ${tranche.min.toLocaleString()} - ${maxDisplay} MGA (${tranche.taux}%)\n`;
      result += `  Montant dans la tranche: ${tranche.montantTranche.toLocaleString()} MGA\n`;
      result += `  Impôt: ${tranche.impotTranche.toLocaleString()} MGA\n\n`;
    });

    result += `IRSA Total: ${calculation.montantTotal.toLocaleString()} MGA\n`;
    result += `Taux effectif: ${calculation.tauxEffectif}%`;

    return result;
  }

  /**
   * Valide si un montant est soumis à l'IRSA
   */
  static estSoumisIRSA(salaireImposable: number): boolean {
    return salaireImposable > 350000; // Seuil d'exonération
  }

  /**
   * Calcule le salaire net après toutes déductions (CNAPS, OSTIE, IRSA)
   */
  static calculerSalaireNet(salaireBrut: number, cnaps: number, ostie: number): {
    salaireImposable: number;
    irsa: number;
    salaireNet: number;
  } {
    const salaireImposable = salaireBrut - cnaps - ostie;
    const irsaCalculation = this.calculerIRSA(salaireImposable);
    const salaireNet = salaireImposable - irsaCalculation.montantTotal;

    return {
      salaireImposable,
      irsa: irsaCalculation.montantTotal,
      salaireNet
    };
  }
}