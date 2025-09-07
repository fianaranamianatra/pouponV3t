// Composant de gestion des montants d'écolage par classe
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  BookOpen, 
  Plus, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  School,
  Calculator,
  TrendingUp,
  Users
} from 'lucide-react';
import { Modal } from '../Modal';
import { useClassEcolageAmounts } from '../../hooks/useClassEcolageAmounts';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { classesService } from '../../lib/firebase/firebaseService';
import { ClassEcolageAmount } from '../../lib/services/classEcolageService';

interface ClassEcolageManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClassEcolageManagement({ isOpen, onClose }: ClassEcolageManagementProps) {
  const {
    classAmounts,
    settings,
    loading,
    error,
    setClassAmount,
    updateSettings,
    initializeDefaults
  } = useClassEcolageAmounts();

  const { data: classes, loading: classesLoading } = useFirebaseCollection(classesService, true);
  
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    monthlyAmount: 0,
    registrationFee: 50000,
    examFee: 25000,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEditClass = (className: string) => {
    const existingAmount = classAmounts.find(a => a.className === className);
    
    if (existingAmount) {
      setFormData({
        monthlyAmount: existingAmount.monthlyAmount,
        registrationFee: existingAmount.registrationFee || 50000,
        examFee: existingAmount.examFee || 25000,
        notes: existingAmount.notes || ''
      });
    } else {
      // Montants par défaut selon la classe
      const defaultAmounts: { [key: string]: number } = {
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
      
      const classData = classes.find(c => c.name === className);
      const defaultAmount = defaultAmounts[className] || 150000;
      
      setFormData({
        monthlyAmount: defaultAmount,
        registrationFee: 50000,
        examFee: 25000,
        notes: ''
      });
    }
    
    setEditingClass(className);
  };

  const handleSaveClass = async () => {
    if (!editingClass) return;
    
    setIsSubmitting(true);
    try {
      const classData = classes.find(c => c.name === editingClass);
      if (!classData) {
        throw new Error('Classe non trouvée');
      }

      await setClassAmount({
        className: editingClass,
        level: classData.level,
        monthlyAmount: formData.monthlyAmount,
        annualAmount: formData.monthlyAmount * 10,
        registrationFee: formData.registrationFee,
        examFee: formData.examFee,
        isActive: true,
        effectiveDate: new Date().toISOString().split('T')[0],
        notes: formData.notes
      });
      
      setEditingClass(null);
      alert(`✅ Montant d'écolage défini pour ${editingClass}: ${formData.monthlyAmount.toLocaleString()} Ar/mois`);
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setFormData({
      monthlyAmount: 0,
      registrationFee: 50000,
      examFee: 25000,
      notes: ''
    });
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialiser les montants par défaut pour toutes les classes ?')) {
      return;
    }

    try {
      await initializeDefaults(classes);
      alert('✅ Montants par défaut initialisés pour toutes les classes');
    } catch (err: any) {
      alert('❌ Erreur lors de l\'initialisation: ' + err.message);
    }
  };

  const getClassAmount = (className: string): ClassEcolageAmount | null => {
    return classAmounts.find(a => a.className === className) || null;
  };

  const totalConfiguredClasses = classAmounts.filter(a => a.isActive).length;
  const totalMonthlyRevenue = classAmounts
    .filter(a => a.isActive)
    .reduce((sum, a) => {
      const classData = classes.find(c => c.name === a.className);
      const studentCount = classData?.studentCount || 0;
      return sum + (a.monthlyAmount * studentCount);
    }, 0);

  if (loading || classesLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Configuration des Montants d'Écolage" size="xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la configuration...</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuration des Montants d'Écolage" size="xl">
      <div className="space-y-6">
        {/* Header avec statistiques */}
        <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600`} />
              <div>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-blue-900`}>Configuration des Montants par Classe</h2>
                <p className={`${isMobile ? 'text-sm' : ''} text-blue-700`}>Définissez les montants d'écolage pour chaque classe</p>
              </div>
            </div>
            
            <button
              onClick={handleInitializeDefaults}
              className={`inline-flex items-center ${isMobile ? 'px-4 py-2 text-sm' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              <RefreshCw className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-2`} />
              Initialiser Défauts
            </button>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600`}>Classes Configurées</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-800`}>{totalConfiguredClasses}</p>
                </div>
                <BookOpen className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
              </div>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-600`}>Total Classes</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-800`}>{classes.length}</p>
                </div>
                <School className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
              </div>
            </div>
            
            <div className={`bg-white border border-purple-200 rounded-lg p-3 ${isMobile ? 'col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600`}>Revenus Mensuels Estimés</p>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-800`}>
                    {(totalMonthlyRevenue / 1000000).toFixed(1)}M Ar
                  </p>
                </div>
                <TrendingUp className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-purple-600`} />
              </div>
            </div>
            
            <div className={`bg-white border border-orange-200 rounded-lg p-3 ${isMobile ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Taux Configuration</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {classes.length > 0 ? Math.round((totalConfiguredClasses / classes.length) * 100) : 0}%
                  </p>
                </div>
                <Calculator className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={`bg-red-50 border border-red-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-red-600`} />
              <p className={`text-red-700 ${isMobile ? 'text-sm' : ''}`}>{error}</p>
            </div>
          </div>
        )}

        {/* Liste des classes */}
        <div className={`bg-white border border-gray-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>Montants par Classe</h3>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
              {classes.length} classe(s) disponible(s)
            </span>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
            {classes.map((classItem) => {
              const configuredAmount = getClassAmount(classItem.name);
              const isEditing = editingClass === classItem.name;
              
              return (
                <div key={classItem.id} className={`border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{classItem.name}</h4>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>{classItem.level}</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                        {classItem.studentCount || 0} élève(s)
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {configuredAmount ? (
                        <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
                      ) : (
                        <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`} />
                      )}
                      
                      <button
                        onClick={() => handleEditClass(classItem.name)}
                        className={`${isMobile ? 'p-1.5' : 'p-2'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                      >
                        <Edit className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                          Montant mensuel (Ar)
                        </label>
                        <input
                          type="number"
                          value={formData.monthlyAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, monthlyAmount: parseInt(e.target.value) || 0 }))}
                          min="0"
                          step="1000"
                          className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                          Frais d'inscription (Ar)
                        </label>
                        <input
                          type="number"
                          value={formData.registrationFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, registrationFee: parseInt(e.target.value) || 0 }))}
                          min="0"
                          step="1000"
                          className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                          Frais d'examen (Ar)
                        </label>
                        <input
                          type="number"
                          value={formData.examFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, examFee: parseInt(e.target.value) || 0 }))}
                          min="0"
                          step="1000"
                          className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={isMobile ? 2 : 2}
                          className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Notes optionnelles..."
                        />
                      </div>

                      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-2'} pt-2`}>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className={`${isMobile ? 'w-full px-3 py-2 text-sm' : 'flex-1 px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50`}
                        >
                          <X className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-1 inline`} />
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveClass}
                          disabled={isSubmitting}
                          className={`${isMobile ? 'w-full px-3 py-2 text-sm' : 'flex-1 px-3 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50`}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <div className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
                              Sauvegarde...
                            </div>
                          ) : (
                            <>
                              <Save className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-1 inline`} />
                              Sauvegarder
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {configuredAmount ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Mensuel:</span>
                            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-green-600`}>
                              {configuredAmount.monthlyAmount.toLocaleString()} Ar
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Annuel:</span>
                            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-blue-600`}>
                              {configuredAmount.annualAmount.toLocaleString()} Ar
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Inscription:</span>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-800`}>
                              {(configuredAmount.registrationFee || 0).toLocaleString()} Ar
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Examen:</span>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-800`}>
                              {(configuredAmount.examFee || 0).toLocaleString()} Ar
                            </span>
                          </div>
                          
                          {/* Revenus estimés pour cette classe */}
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600 font-medium`}>Revenus/mois:</span>
                              <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-purple-600`}>
                                {((configuredAmount.monthlyAmount * (classItem.studentCount || 0)) / 1000000).toFixed(1)}M Ar
                              </span>
                            </div>
                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                              {classItem.studentCount || 0} élève(s) × {configuredAmount.monthlyAmount.toLocaleString()} Ar
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <AlertTriangle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-500 mx-auto mb-2`} />
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-700 font-medium`}>Non configuré</p>
                          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Cliquez pour définir</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className={`bg-green-50 border border-green-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-green-900 mb-3`}>
            🎯 Comment ça fonctionne
          </h3>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'} ${isMobile ? 'text-sm' : 'text-sm'} text-green-800`}>
            <div>
              <h4 className="font-medium mb-2">✅ Configuration automatique:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Définissez le montant mensuel par classe</li>
                <li>• Le montant annuel est calculé automatiquement (×10 mois)</li>
                <li>• Frais d'inscription et d'examen configurables</li>
                <li>• Estimation des revenus par classe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔄 Intégration automatique:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• <strong>Remplissage automatique</strong> dans Gestion Écolage</li>
                <li>• Montant suggéré selon la classe de l'élève</li>
                <li>• Validation automatique des montants</li>
                <li>• Synchronisation temps réel</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white border border-green-200 rounded-lg">
            <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-green-800`}>
              <strong>📋 Utilisation :</strong> Une fois configurés, ces montants seront automatiquement 
              proposés lors de l'ajout de paiements dans le module Gestion Écolage, selon la classe de l\'élève sélectionné.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-end space-x-3'} pt-4 border-t border-gray-200`}>
          <button
            onClick={onClose}
            className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'px-6 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}