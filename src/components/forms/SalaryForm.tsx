import React, { useState, useEffect } from 'react';
import { User, DollarSign, Calendar, FileText, Calculator, Wallet, TrendingUp, Building, Eye, History, Clock } from 'lucide-react';
import { Avatar } from '../Avatar';
import { IRSAService } from '../../lib/services/irsaService';
import { Modal } from '../Modal';
import { PayslipPreview } from '../payroll/PayslipPreview';
import { SalaryHistoryModal } from '../modals/SalaryHistoryModal';

interface SalaryFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  employees?: any[];
  teachers?: any[];
  isSubmitting?: boolean;
}

export function SalaryForm({ onSubmit, onCancel, initialData, employees = [], teachers = [], isSubmitting = false }: SalaryFormProps) {
  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || '',
    employeeName: initialData?.employeeName || '',
    employeeType: initialData?.employeeType || 'staff',
    position: initialData?.position || '',
    department: initialData?.department || '',
    paymentMonth: initialData?.paymentMonth?.toString() || (new Date().getMonth() + 1).toString(),
    paymentYear: initialData?.paymentYear?.toString() || new Date().getFullYear().toString(),
    baseSalary: initialData?.baseSalary || '',
    transportAllowance: initialData?.allowances?.transport || '',
    housingAllowance: initialData?.allowances?.housing || '',
    mealAllowance: initialData?.allowances?.meal || '',
    performanceAllowance: initialData?.allowances?.performance || '',
    otherAllowance: initialData?.allowances?.other || '',
    effectiveDate: initialData?.effectiveDate || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
    changeReason: '' // For edits
  });

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showPayslipPreview, setShowPayslipPreview] = useState(false);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    totalGross: 0,
    cnaps: 0,
    ostie: 0,
    taxableIncome: 0,
    irsa: 0,
    totalDeductions: 0,
    netSalary: 0
  });

  // Combine employees and teachers for selection
  const allEmployees = [
    ...employees.filter(emp => emp.status === 'active'), // Filtrer seulement les employés actifs
    ...teachers.filter(teacher => teacher.status && teacher.status !== 'inactive').map(teacher => ({ 
      ...teacher, 
      type: 'teacher',
      position: teacher.subject || 'Enseignant',
      department: 'Enseignement'
    }))
  ];

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

  // Mock salary history data
  const mockSalaryHistory = [
    {
      id: '1',
      employeeId: selectedEmployee?.id || '',
      previousSalary: 750000,
      newSalary: 800000,
      changeReason: 'Augmentation annuelle',
      effectiveDate: '2024-01-01',
      modifiedBy: 'Admin LES POUPONS',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      employeeId: selectedEmployee?.id || '',
      previousSalary: 700000,
      newSalary: 750000,
      changeReason: 'Promotion',
      effectiveDate: '2023-09-01',
      modifiedBy: 'Directeur',
      createdAt: new Date('2023-09-01')
    }
  ];

  // Calculate salary components when values change
  useEffect(() => {
    const baseSalary = parseFloat(formData.baseSalary) || 0;
    const transportAllowance = parseFloat(formData.transportAllowance) || 0;
    const housingAllowance = parseFloat(formData.housingAllowance) || 0;
    const mealAllowance = parseFloat(formData.mealAllowance) || 0;
    const performanceAllowance = parseFloat(formData.performanceAllowance) || 0;
    const otherAllowance = parseFloat(formData.otherAllowance) || 0;

    const totalGross = baseSalary + transportAllowance + housingAllowance + mealAllowance + performanceAllowance + otherAllowance;
    const cnaps = Math.round(totalGross * 0.01); // 1% employee contribution
    const ostie = Math.round(totalGross * 0.01); // 1% employee contribution
    const taxableIncome = totalGross - cnaps - ostie;
    
    // Calculate IRSA using the service
    const irsaCalculation = IRSAService.calculerIRSA(taxableIncome);
    const irsa = irsaCalculation.montantTotal;
    
    const totalDeductions = cnaps + ostie + irsa;
    const netSalary = totalGross - totalDeductions;

    setCalculatedValues({
      totalGross,
      cnaps,
      ostie,
      taxableIncome,
      irsa,
      totalDeductions,
      netSalary
    });
  }, [formData.baseSalary, formData.transportAllowance, formData.housingAllowance, formData.mealAllowance, formData.performanceAllowance, formData.otherAllowance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de base
    if (!formData.employeeId || !formData.baseSalary) {
      alert('Veuillez sélectionner un employé et saisir un salaire');
      return;
    }
    
    const submitData = {
      ...formData,
      ...calculatedValues
    };
    
    console.log('📤 Soumission des données de salaire:', submitData);
    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmployeeSelection = (employeeId: string) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setFormData(prev => ({
        ...prev,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeType: employee.type || (employee.department === 'Enseignement' ? 'teacher' : 'staff'),
        position: employee.position || employee.subject || 'Non spécifié',
        department: employee.department || (employee.subject ? 'Enseignement' : 'Administration')
      }));
    }
  };

  const handlePreviewPayslip = () => {
    if (!selectedEmployee || calculatedValues.totalGross === 0) {
      alert('Veuillez sélectionner un employé et saisir un salaire pour voir l\'aperçu');
      return;
    }
    setShowPayslipPreview(true);
  };

  const handleViewHistory = () => {
    if (!selectedEmployee) {
      alert('Veuillez sélectionner un employé pour voir son historique');
      return;
    }
    setShowSalaryHistory(true);
  };

  // Préparer les données pour l'aperçu du bulletin
  const payslipData = selectedEmployee ? {
    employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
    position: formData.position,
    department: formData.department,
    paymentMonth: monthOptions.find(m => m.value === parseInt(formData.paymentMonth.toString()))?.label || '',
    paymentYear: formData.paymentYear,
    calculation: {
      grossSalary: calculatedValues.totalGross,
      cnaps: {
        employeeContribution: calculatedValues.cnaps,
        employerContribution: Math.round(calculatedValues.totalGross * 0.13)
      },
      ostie: {
        employeeContribution: calculatedValues.ostie,
        employerContribution: Math.round(calculatedValues.totalGross * 0.05)
      },
      irsa: calculatedValues.irsa,
      totalDeductions: calculatedValues.totalDeductions,
      netSalary: calculatedValues.netSalary,
      allowances: {
        transport: parseFloat(formData.transportAllowance) || 0,
        housing: parseFloat(formData.housingAllowance) || 0,
        meal: parseFloat(formData.mealAllowance) || 0,
        performance: parseFloat(formData.performanceAllowance) || 0,
        other: parseFloat(formData.otherAllowance) || 0
      }
    }
  } : null;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Sélection de l'Employé
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employé
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.employeeId}
                onChange={(e) => handleEmployeeSelection(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionner un employé</option>
                <optgroup label="Personnel des Ressources Humaines">
                  {employees.filter(emp => emp.department !== 'Enseignement').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position} ({emp.department})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Enseignants">
                  {employees.filter(emp => emp.department === 'Enseignement').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </option>
                  ))}
                  {teachers.length > 0 && teachers.map(teacher => (
                    <option key={`teacher-${teacher.id}`} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} - {teacher.subject} (Enseignant)
                    </option>
                  ))}
                </optgroup>
              </select>
              
              <button
                type="button"
                onClick={handleViewHistory}
                disabled={!selectedEmployee}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Voir l'historique des salaires"
              >
                <History className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {selectedEmployee && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Avatar 
                  firstName={selectedEmployee.firstName} 
                  lastName={selectedEmployee.lastName} 
                  size="md" 
                  showPhoto={true}
                />
                <div>
                  <h4 className="font-medium text-blue-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                  <p className="text-blue-700 text-sm">{formData.position}</p>
                  <p className="text-blue-600 text-xs">{formData.department}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'employé
              </label>
              <select
                name="employeeType"
                value={formData.employeeType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="staff">Personnel</option>
                <option value="teacher">Enseignant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date d'effet
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payment Period Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Période de Paiement
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois de paiement
              </label>
              <select
                name="paymentMonth"
                value={formData.paymentMonth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année de paiement
              </label>
              <select
                name="paymentYear"
                value={formData.paymentYear}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Période sélectionnée:</strong> {monthOptions.find(m => m.value === parseInt(formData.paymentMonth.toString()))?.label} {formData.paymentYear}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Composition du Salaire
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Salaire de Base (Ariary)
            </label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              placeholder="ex: 800000"
              required
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Transport
              </label>
              <input
                type="number"
                name="transportAllowance"
                value={formData.transportAllowance}
                onChange={handleChange}
                placeholder="ex: 50000"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Logement
              </label>
              <input
                type="number"
                name="housingAllowance"
                value={formData.housingAllowance}
                onChange={handleChange}
                placeholder="ex: 100000"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indemnité Repas
              </label>
              <input
                type="number"
                name="mealAllowance"
                value={formData.mealAllowance}
                onChange={handleChange}
                placeholder="ex: 30000"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prime Performance
              </label>
              <input
                type="number"
                name="performanceAllowance"
                value={formData.performanceAllowance}
                onChange={handleChange}
                placeholder="ex: 80000"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autres Indemnités
            </label>
            <input
              type="number"
              name="otherAllowance"
              value={formData.otherAllowance}
              onChange={handleChange}
              placeholder="ex: 25000"
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {calculatedValues.totalGross > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Calcul Automatique du Salaire
            </h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              {/* Gross Salary Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-green-800">Composition Salaire Brut</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Salaire de base:</span>
                    <span className="font-medium">{(parseFloat(formData.baseSalary) || 0).toLocaleString()} Ar</span>
                  </div>
                  {parseFloat(formData.transportAllowance) > 0 && (
                    <div className="flex justify-between">
                      <span>Indemnité transport:</span>
                      <span className="font-medium text-green-600">+{(parseFloat(formData.transportAllowance)).toLocaleString()} Ar</span>
                    </div>
                  )}
                  {parseFloat(formData.housingAllowance) > 0 && (
                    <div className="flex justify-between">
                      <span>Indemnité logement:</span>
                      <span className="font-medium text-green-600">+{(parseFloat(formData.housingAllowance)).toLocaleString()} Ar</span>
                    </div>
                  )}
                  {parseFloat(formData.mealAllowance) > 0 && (
                    <div className="flex justify-between">
                      <span>Indemnité repas:</span>
                      <span className="font-medium text-green-600">+{(parseFloat(formData.mealAllowance)).toLocaleString()} Ar</span>
                    </div>
                  )}
                  {parseFloat(formData.performanceAllowance) > 0 && (
                    <div className="flex justify-between">
                      <span>Prime performance:</span>
                      <span className="font-medium text-green-600">+{(parseFloat(formData.performanceAllowance)).toLocaleString()} Ar</span>
                    </div>
                  )}
                  {parseFloat(formData.otherAllowance) > 0 && (
                    <div className="flex justify-between">
                      <span>Autres indemnités:</span>
                      <span className="font-medium text-green-600">+{(parseFloat(formData.otherAllowance)).toLocaleString()} Ar</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Salaire Brut Total:</span>
                      <span className="text-lg text-green-700">{calculatedValues.totalGross.toLocaleString()} Ar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions and Net Salary */}
              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-green-800">Déductions et Salaire Net</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CNAPS (1%):</span>
                    <span className="font-medium text-red-600">-{calculatedValues.cnaps.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OSTIE (1%):</span>
                    <span className="font-medium text-red-600">-{calculatedValues.ostie.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salaire imposable:</span>
                    <span className="font-medium">{calculatedValues.taxableIncome.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IRSA (Impôt):</span>
                    <span className="font-medium text-red-600">-{calculatedValues.irsa.toLocaleString()} Ar</span>
                  </div>
                  <div className="border-t border-green-300 pt-2">
                    <div className="flex justify-between">
                      <span>Total déductions:</span>
                      <span className="font-medium text-red-600">-{calculatedValues.totalDeductions.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  <div className="border-t border-green-300 pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Salaire Net:</span>
                      <span className="text-xl text-green-700">{calculatedValues.netSalary.toLocaleString()} Ar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du changement
            </label>
            <input
              type="text"
              name="changeReason"
              value={formData.changeReason}
              onChange={handleChange}
              placeholder="ex: Augmentation annuelle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Notes additionnelles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handlePreviewPayslip}
          disabled={!selectedEmployee || calculatedValues.totalGross === 0}
          className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4 mr-2 inline" />
          Aperçu du Bulletin
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {initialData ? 'Modification...' : 'Enregistrement...'}
            </div>
          ) : (
            initialData ? 'Modifier le Salaire' : 'Enregistrer le Salaire'
          )}
        </button>
      </div>
      </form>

      {/* Payslip Preview Modal */}
      {payslipData && (
        <Modal
          isOpen={showPayslipPreview}
          onClose={() => setShowPayslipPreview(false)}
          title="Aperçu du Bulletin de Paie"
          size="lg"
        >
          <PayslipPreview
            data={payslipData}
            onClose={() => setShowPayslipPreview(false)}
          />
        </Modal>
      )}

      {/* Salary History Modal */}
      {selectedEmployee && (
        <SalaryHistoryModal
          isOpen={showSalaryHistory}
          onClose={() => setShowSalaryHistory(false)}
          employee={{
            employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
            position: formData.position,
            department: formData.department,
            baseSalary: parseFloat(formData.baseSalary) || 0,
            netSalary: calculatedValues.netSalary
          }}
          history={mockSalaryHistory}
        />
      )}
    </>
  );
}