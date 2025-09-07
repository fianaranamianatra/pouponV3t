// Composant de configuration rapide des montants d'écolage
import React, { useState } from 'react';
import { Settings, DollarSign, BookOpen, Zap, CheckCircle, AlertTriangle, Calculator } from 'lucide-react';
import { useClassEcolageAmounts } from '../../hooks/useClassEcolageAmounts';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { classesService } from '../../lib/firebase/firebaseService';

interface EcolageQuickSetupProps {
  className?: string;
}

export function EcolageQuickSetup({ className = '' }: EcolageQuickSetupProps) {
  const { classAmounts, initializeDefaults } = useClassEcolageAmounts();
  const { data: classes } = useFirebaseCollection(classesService, true);
  const [isInitializing, setIsInitializing] = useState(false);

  const configuredClasses = classAmounts.filter(a => a.isActive).length;
  const totalClasses = classes.length;
  const isFullyConfigured = configuredClasses === totalClasses && totalClasses > 0;

  const handleQuickSetup = async () => {
    if (!confirm(`Initialiser les montants d'écolage pour ${totalClasses} classe(s) ?`)) {
      return;
    }

    setIsInitializing(true);
    try {
      await initializeDefaults(classes);
      alert(`✅ Configuration terminée !
      
Montants initialisés pour ${totalClasses} classe(s) :
• Maternelle : 120 000 - 150 000 Ar/mois
• Primaire : 160 000 - 200 000 Ar/mois  
• Spécialisé : 100 000 - 110 000 Ar/mois

Les montants sont maintenant disponibles dans la Gestion Écolage.`);
    } catch (error: any) {
      alert('❌ Erreur lors de l\'initialisation: ' + error.message);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isFullyConfigured) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">Configuration Complète</h3>
            <p className="text-green-700 text-sm">
              {configuredClasses} classe(s) configurée(s) • Montants automatiques actifs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-800">Configuration des Montants</h3>
            <p className="text-blue-700 text-sm">
              {configuredClasses}/{totalClasses} classe(s) configurée(s)
            </p>
          </div>
        </div>
        
        <button
          onClick={handleQuickSetup}
          disabled={isInitializing || totalClasses === 0}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isInitializing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isInitializing ? 'Configuration...' : 'Configuration Rapide'}
        </button>
      </div>
      
      {totalClasses === 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Aucune classe trouvée. Créez d'abord des classes dans le module "Gestion des Classes".
          </p>
        </div>
      )}
    </div>
  );
}