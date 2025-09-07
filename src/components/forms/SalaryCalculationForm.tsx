import React, { useState, useEffect } from 'react';
import { 
  User, 
  DollarSign, 
  Calendar, 
  Calculator, 
  CreditCard, 
  Building, 
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Avatar } from '../Avatar';
import { IRSAService } from '../../lib/services/irsaService';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  status: 'active' | 'inactive';
  contractType?: string;
  entryDate?: string;
}

interface SalaryCalculationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  employees: Employee[];
  isSubmitting?: boolean;
}

interface SalaryCalculation {
  grossSalary: number;
  cnaps: number;
  ostie: number;
  taxableIncome: number;
  irsa: number;
  totalDeductions: number;
  netSalary: number;
}

export function SalaryCalculationForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  employees = [], 
  isSubmitting = false 
}: SalaryCalculationFormProps) {
  // 1. SÉLECTION DU PERSONNEL
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialData?.employeeId || '');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // 2. PARAMÈTRES DE PAIE
  const [paymentMode, setPaymentMode] = useState(initialData?.paymentMode || 'monthly');
  const [referenceYear, setReferenceYear] = useState(initialData?.paymentYear || new Date().getFullYear());
  const [referenceMonth, setReferenceMonth] = useState(initialData?.paymentMonth || new Date().getMonth() + 1);
  const [effectiveDate, setEffectiveDate] = useState(initialData?.effectiveDate || new Date().toISOString().split('T')[0]);

  // 3. STRUCTURE SALARIALE
  const [baseSalary, setBaseSalary] = useState(initialData?.baseSalary || 0);
  const [allowances, setAllowances] = useState({
    transport: initialData?.allowances?.transport || 0,
    housing: initialData?.allowances?.housing || 0,
    meal: initialData?.allowances?.meal || 0,
    performance: initialData?.allowances?.performance || 0,
    other: initialData?.allowances?.other || 0
  });

  // 4. CALCUL AUTOMATISÉ
  const [calculation, setCalculation] = useState<SalaryCalculation>({
    grossSalary: 0,
    cnaps: 0,
    ostie: 0,
    taxableIncome: 0,
    irsa: 0,
    totalDeductions: 0,
    netSalary: 0
  });

  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState(initialData?.status || 'active');

  // Options pour les mois
  const monthOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  // Options pour les années
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Effet pour charger automatiquement les données de l'employé sélectionné
  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        setSelectedEmployee(employee);
        // Récupération automatique du salaire de base depuis RH
        setBaseSalary(employee.salary);
        console.log(`✅ Employé sélectionné: ${employee.firstName} ${employee.lastName} - Salaire de base: ${employee.salary.toLocaleString()} Ar`);
      }
    } else {
      setSelectedEmployee(null);
      setBaseSalary(0);
    }
  }, [selectedEmployeeId, employees]);

  // Effet pour le calcul automatisé en temps réel
  useEffect(() => {
    if (baseSalary > 0) {
      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
      const grossSalary = baseSalary + totalAllowances;
      
      // Calcul des déductions légales
      const cnaps = Math.round(grossSalary * 0.01); // 1% CNAPS salarié
      const ostie = Math.round(grossSalary * 0.01); // 1% OSTIE salarié
      const taxableIncome = grossSalary - cnaps - ostie;
      
      // Calcul IRSA avec le service dédié
      const irsaCalculation = IRSAService.calculerIRSA(taxableIncome);
      const irsa = irsaCalculation.montantTotal;
      
      const totalDeductions = cnaps + ostie + irsa;
      const netSalary = grossSalary - totalDeductions;

      setCalculation({
        grossSalary,
        cnaps,
        ostie,
        taxableIncome,
        irsa,
        totalDeductions,
        netSalary
      });

      console.log(`🧮 Calcul automatique mis à jour:`, {
        grossSalary: grossSalary.toLocaleString(),
        netSalary: netSalary.toLocaleString(),
        irsaRate: irsaCalculation.tauxEffectif
      });
    }
  }, [baseSalary, allowances]);

  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleAllowanceChange = (type: keyof typeof allowances, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setAllowances(prev => ({
      ...prev,
      [type]: numericValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    if (calculation.grossSalary === 0) {
      alert('Veuillez saisir un salaire de base');
      return;
    }

    const submitData = {
      // Données employé
      employeeId: selectedEmployee.id,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      employeeType: selectedEmployee.department === 'Enseignement' ? 'teacher' : 'staff',
      position: selectedEmployee.position,
      department: selectedEmployee.department,
      
      // Paramètres de paie
      paymentMode,
      paymentMonth: referenceMonth,
      paymentYear: referenceYear,
      effectiveDate,
      
      // Structure salariale
      baseSalary,
      allowances,
      
      // Calculs
      totalGross: calculation.grossSalary,
      cnaps: calculation.cnaps,
      ostie: calculation.ostie,
      irsa: calculation.irsa,
      totalDeductions: calculation.totalDeductions,
      netSalary: calculation.netSalary,
      
      // Métadonnées
      status,
      notes
    };

    console.log('📤 Soumission des données de calcul de salaire:', submitData);
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. SÉLECTION DU PERSONNEL */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
          <User className="w-6 h-6 mr-2" />
          1. Sélection du Personnel
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employé *
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeSelection(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Sélectionner un employé</option>
              <optgroup label="🏛️ Direction ({employees.filter(emp => emp.department === 'Direction').length})">
                {employees.filter(emp => emp.department === 'Direction').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position} ({emp.salary.toLocaleString()} Ar)
                  </option>
                ))}
              </optgroup>
              <optgroup label="📋 Administration ({employees.filter(emp => emp.department === 'Administration').length})">
                {employees.filter(emp => emp.department === 'Administration').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position} ({emp.salary.toLocaleString()} Ar)
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎓 Enseignement ({employees.filter(emp => emp.department === 'Enseignement').length})">
                {employees.filter(emp => emp.department === 'Enseignement').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position} ({emp.salary.toLocaleString()} Ar)
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔧 Service ({employees.filter(emp => emp.department === 'Service').length})">
                {employees.filter(emp => emp.department === 'Service').map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.position} ({emp.salary.toLocaleString()} Ar)
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>📊 Source :</strong> Module Ressources Humaines • 
                <strong>Filtre :</strong> Employés actifs uniquement • 
                <strong>Total disponible :</strong> {employees.length} employé(s)
              </p>
            </div>
          </div>

          {/* Affichage automatique du poste occupé */}
          {selectedEmployee && (
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <Avatar 
                  firstName={selectedEmployee.firstName} 
                  lastName={selectedEmployee.lastName} 
                  size="lg" 
                  showPhoto={true}
                />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h4>
                  <p className="text-blue-700 font-medium">{selectedEmployee.position}</p>
                  <p className="text-blue-600 text-sm">{selectedEmployee.department}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Contrat: {selectedEmployee.contractType || 'CDI'}</span>
                    {selectedEmployee.entryDate && (
                      <span>Entrée: {new Date(selectedEmployee.entryDate).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span className="text-green-600 font-medium">✅ Depuis RH</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">💰 Salaire RH (Synchronisé)</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedEmployee.salary.toLocaleString()} Ar
                  </p>
                  <p className="text-xs text-gray-500">
                    Mis à jour automatiquement depuis RH
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. PARAMÈTRES DE PAIE */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
          <CreditCard className="w-6 h-6 mr-2" />
          2. Paramètres de Paie
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="monthly">Mensuel</option>
              <option value="quarterly">Trimestriel</option>
              <option value="annual">Annuel</option>
              <option value="bonus">Prime exceptionnelle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de référence
            </label>
            <select
              value={referenceYear}
              onChange={(e) => setReferenceYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois de référence
            </label>
            <select
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {monthOptions.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date d'effet
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 bg-white border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">
            <strong>Période sélectionnée:</strong> {monthOptions.find(m => m.value === referenceMonth)?.label} {referenceYear} 
            • <strong>Mode:</strong> {paymentMode === 'monthly' ? 'Mensuel' : paymentMode === 'quarterly' ? 'Trimestriel' : 'Annuel'}
          </p>
        </div>
      </div>

      {/* 3. STRUCTURE SALARIALE */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
          <Wallet className="w-6 h-6 mr-2" />
          3. Structure Salariale
        </h3>
        
        <div className="space-y-4">
          {/* Salaire de base (récupéré automatiquement) */}
          <div className="bg-white border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Salaire de Base (Récupéré automatiquement depuis RH)
              </label>
              {selectedEmployee && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Synchronisé avec RH</span>
                </div>
              )}
            </div>
            <input
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
              min="0"
              step="1000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-bold"
              placeholder="Salaire de base en Ariary"
            />
            {selectedEmployee && baseSalary !== selectedEmployee.salary && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-700 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Attention: Le salaire saisi ({baseSalary.toLocaleString()} Ar) diffère du salaire RH ({selectedEmployee.salary.toLocaleString()} Ar)
                </p>
              </div>
            )}
          </div>

          {/* Indemnités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Transport
              </label>
              <input
                type="number"
                value={allowances.transport}
                onChange={(e) => handleAllowanceChange('transport', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ex: 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Logement
              </label>
              <input
                type="number"
                value={allowances.housing}
                onChange={(e) => handleAllowanceChange('housing', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ex: 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Repas
              </label>
              <input
                type="number"
                value={allowances.meal}
                onChange={(e) => handleAllowanceChange('meal', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ex: 30000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prime de Performance
              </label>
              <input
                type="number"
                value={allowances.performance}
                onChange={(e) => handleAllowanceChange('performance', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ex: 80000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autres Indemnités Variables
              </label>
              <input
                type="number"
                value={allowances.other}
                onChange={(e) => handleAllowanceChange('other', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="ex: 25000"
              />
            </div>
          </div>

          {/* Résumé de la structure salariale */}
          {calculation.grossSalary > 0 && (
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-3">Composition du Salaire Brut</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Salaire de base:</span>
                  <span className="font-medium">{baseSalary.toLocaleString()} Ar</span>
                </div>
                {allowances.transport > 0 && (
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span className="font-medium text-green-600">+{allowances.transport.toLocaleString()} Ar</span>
                  </div>
                )}
                {allowances.housing > 0 && (
                  <div className="flex justify-between">
                    <span>Logement:</span>
                    <span className="font-medium text-green-600">+{allowances.housing.toLocaleString()} Ar</span>
                  </div>
                )}
                {allowances.meal > 0 && (
                  <div className="flex justify-between">
                    <span>Repas:</span>
                    <span className="font-medium text-green-600">+{allowances.meal.toLocaleString()} Ar</span>
                  </div>
                )}
                {allowances.performance > 0 && (
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span className="font-medium text-green-600">+{allowances.performance.toLocaleString()} Ar</span>
                  </div>
                )}
                {allowances.other > 0 && (
                  <div className="flex justify-between">
                    <span>Autres:</span>
                    <span className="font-medium text-green-600">+{allowances.other.toLocaleString()} Ar</span>
                  </div>
                )}
                <div className="col-span-full border-t border-purple-300 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>SALAIRE BRUT TOTAL:</span>
                    <span className="text-purple-600">{calculation.grossSalary.toLocaleString()} Ar</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. CALCUL AUTOMATISÉ */}
      {calculation.grossSalary > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
            <Calculator className="w-6 h-6 mr-2" />
            4. Calcul Automatisé
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Déductions légales */}
            <div className="space-y-4">
              <h4 className="font-medium text-orange-800 mb-3">Déductions Légales</h4>
              
              <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Salaire Brut Total:</span>
                  <span className="text-lg font-bold text-gray-900">{calculation.grossSalary.toLocaleString()} Ar</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CNAPS (1% salarié):</span>
                    <span className="font-medium text-red-600">-{calculation.cnaps.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">OSTIE (1% salarié):</span>
                    <span className="font-medium text-red-600">-{calculation.ostie.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-sm font-medium text-gray-700">Salaire Imposable:</span>
                    <span className="font-bold text-blue-600">{calculation.taxableIncome.toLocaleString()} Ar</span>
                  </div>
                </div>
              </div>

              {/* Calcul IRSA détaillé */}
              <div className="bg-white border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <h5 className="font-medium text-purple-800">Calcul IRSA (Impôt sur Revenus)</h5>
                </div>
                
                {calculation.taxableIncome > 350000 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Base imposable:</span>
                      <span className="font-medium">{calculation.taxableIncome.toLocaleString()} Ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IRSA calculé:</span>
                      <span className="font-bold text-red-600">-{calculation.irsa.toLocaleString()} Ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taux effectif:</span>
                      <span className="font-medium text-purple-600">
                        {calculation.taxableIncome > 0 ? ((calculation.irsa / calculation.taxableIncome) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salaire exonéré d'IRSA (≤ 350 000 Ar)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Résultat final */}
            <div className="space-y-4">
              <h4 className="font-medium text-orange-800 mb-3">Résultat Final</h4>
              
              <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total des Déductions</p>
                  <p className="text-2xl font-bold text-red-600">-{calculation.totalDeductions.toLocaleString()} Ar</p>
                  <div className="text-xs text-gray-500 mt-1">
                    CNAPS + OSTIE + IRSA
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-400 rounded-lg p-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-800 mb-2">SALAIRE NET FINAL</p>
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    {calculation.netSalary.toLocaleString()} Ar
                  </p>
                  <div className="text-sm text-green-700">
                    Taux net: {calculation.grossSalary > 0 ? ((calculation.netSalary / calculation.grossSalary) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              {/* Charges patronales (information) */}
              <div className="bg-white border border-orange-200 rounded-lg p-4">
                <h5 className="font-medium text-orange-800 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Charges Patronales (Information)
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CNAPS Employeur (13%):</span>
                    <span className="font-medium text-orange-600">+{Math.round(calculation.grossSalary * 0.13).toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">OSTIE Employeur (5%):</span>
                    <span className="font-medium text-orange-600">+{Math.round(calculation.grossSalary * 0.05).toLocaleString()} Ar</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-700">Coût Total Employeur:</span>
                      <span className="text-purple-600">
                        {(calculation.grossSalary + Math.round(calculation.grossSalary * 0.18)).toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informations complémentaires */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Complémentaires</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut du calcul
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="active">Actif</option>
              <option value="pending">En attente de validation</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes et observations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Notes additionnelles sur ce calcul de salaire..."
            />
          </div>
        </div>
      </div>

      {/* Résumé avant validation */}
      {selectedEmployee && calculation.grossSalary > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            <Info className="w-6 h-6 mr-2" />
            Résumé du Calcul
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-3">Informations Employé</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nom:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                <p><strong>Poste:</strong> {selectedEmployee.position}</p>
                <p><strong>Département:</strong> {selectedEmployee.department}</p>
                <p><strong>Période:</strong> {monthOptions.find(m => m.value === referenceMonth)?.label} {referenceYear}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-3">Résultat Financier</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Salaire brut:</span>
                  <span className="font-bold">{calculation.grossSalary.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>Total déductions:</span>
                  <span className="font-bold text-red-600">-{calculation.totalDeductions.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2">
                  <span className="font-bold">Salaire net:</span>
                  <span className="font-bold text-green-600 text-lg">{calculation.netSalary.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-base font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedEmployee || calculation.grossSalary === 0}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-base font-medium"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {initialData ? 'Modification...' : 'Enregistrement...'}
            </div>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2 inline" />
              {initialData ? 'Modifier le Calcul' : 'Enregistrer le Calcul'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}