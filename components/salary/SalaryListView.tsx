import React from 'react';
import { Eye, Edit, Trash2, Users, DollarSign, Calendar, Building, Calculator, CheckCircle, AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react';
import { Avatar } from '../Avatar';
import { PayrollSyncIndicator } from '../payroll/PayrollSyncIndicator';

interface SalaryRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  position: string;
  department: string;
  paymentMonth: number;
  paymentYear: number;
  baseSalary: number;
  allowances: {
    transport?: number;
    housing?: number;
    meal?: number;
    performance?: number;
    other?: number;
  };
  totalGross: number;
  cnaps: number;
  ostie: number;
  irsa: number;
  totalDeductions: number;
  netSalary: number;
  effectiveDate: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  status: 'active' | 'inactive';
}

interface SalaryListViewProps {
  salaries: SalaryRecord[];
  employees: Employee[];
  onView: (salary: SalaryRecord) => void;
  onEdit: (salary: SalaryRecord) => void;
  onDelete: (salaryId: string) => void;
  loading: boolean;
}

const monthNames = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function SalaryListView({ 
  salaries, 
  employees, 
  onView, 
  onEdit, 
  onDelete, 
  loading 
}: SalaryListViewProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getEmployee = (employeeId: string) => {
    return employees.find(e => e.id === employeeId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'inactive':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'inactive': return 'Inactif';
      default: return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white ${isMobile ? 'rounded-lg p-6' : 'rounded-xl p-8'} shadow-sm border border-gray-100`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des salaires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100 overflow-hidden`}>
      <div className={`bg-gray-50 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>Calculs de Salaires</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>Temps réel</span>
            </div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>{salaries.length} calcul(s)</span>
          </div>
        </div>
      </div>
      
      {salaries.length === 0 ? (
        <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <Calculator className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>Aucun calcul de salaire</h3>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>
            Utilisez le module de calcul automatisé pour créer vos premiers calculs de salaires.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-800 mb-2">Comment commencer ?</h4>
            <ol className="text-sm text-blue-700 space-y-1 text-left">
              <li>1. Cliquez sur "Nouveau Calcul"</li>
              <li>2. Sélectionnez un employé (sync RH)</li>
              <li>3. Ajoutez les indemnités si nécessaire</li>
              <li>4. Le calcul se fait automatiquement</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-4 px-6'} font-medium text-gray-900`}>Employé</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-4 px-6'} font-medium text-gray-900`}>Période</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-4 px-6'} font-medium text-gray-900`}>Salaire Brut</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden md:table-cell' : 'py-4 px-6'} font-medium text-gray-900`}>Déductions</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-4 px-6'} font-medium text-gray-900`}>Salaire Net</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden lg:table-cell' : 'py-4 px-6'} font-medium text-gray-900`}>Statut</th>
                <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-4 px-6'} font-medium text-gray-900`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaries.map((salary) => {
                const employee = getEmployee(salary.employeeId);
                
                return (
                  <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          firstName={salary.employeeName.split(' ')[0] || ''} 
                          lastName={salary.employeeName.split(' ')[1] || ''} 
                          size={isMobile ? "sm" : "md"}
                          showPhoto={true}
                        />
                        <div>
                          <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{salary.employeeName}</p>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>{salary.position}</p>
                          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{salary.department}</p>
                          {/* Indicateur de synchronisation */}
                          <PayrollSyncIndicator
                            employeeId={salary.employeeId}
                            employeeName={salary.employeeName}
                            currentSalary={salary.netSalary}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-2">
                        <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />
                        <div>
                          <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
                            {monthNames[salary.paymentMonth]} {salary.paymentYear}
                          </p>
                          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                            Effet: {new Date(salary.effectiveDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div>
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
                          {salary.totalGross.toLocaleString()} Ar
                        </p>
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 space-y-0.5`}>
                          <p>Base: {salary.baseSalary.toLocaleString()}</p>
                          {Object.values(salary.allowances).reduce((sum, val) => sum + (val || 0), 0) > 0 && (
                            <p>Indemnités: +{Object.values(salary.allowances).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden md:table-cell' : 'py-4 px-6'}`}>
                      <div className={`${isMobile ? 'text-xs' : 'text-xs'} space-y-1`}>
                        <div className="text-red-600">CNAPS: -{salary.cnaps.toLocaleString()}</div>
                        <div className="text-red-600">OSTIE: -{salary.ostie.toLocaleString()}</div>
                        <div className="text-purple-600">IRSA: -{salary.irsa.toLocaleString()}</div>
                        <div className="font-medium text-red-600 border-t border-gray-300 pt-1 mt-1">
                          Total: -{salary.totalDeductions.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div>
                        <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-600`}>
                          {salary.netSalary.toLocaleString()} Ar
                        </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600">Source: RH</span>
                            </div>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                          Taux: {salary.totalGross > 0 ? ((salary.netSalary / salary.totalGross) * 100).toFixed(1) : 0}%
                        </p>
                        {/* Afficher les déductions sur mobile */}
                        {isMobile && (
                          <div className="text-xs text-red-600 mt-1">
                            Déductions: -{salary.totalDeductions.toLocaleString()} Ar
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden lg:table-cell' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(salary.status)}
                        <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded-full font-medium ${getStatusColor(salary.status)}`}>
                          {getStatusLabel(salary.status)}
                        </span>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <button
                          onClick={() => onView(salary)}
                          className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                          title="Voir les détails"
                        >
                          <Eye className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                        </button>
                        {!isMobile && (
                          <>
                            <button
                              onClick={() => onEdit(salary)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => salary.id && onDelete(salary.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Menu mobile pour les actions supplémentaires */}
                        {isMobile && (
                          <button 
                            onClick={() => {
                              const choice = confirm('Modifier ce calcul de salaire ?');
                              if (choice) {
                                onEdit(salary);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Plus d'actions"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}