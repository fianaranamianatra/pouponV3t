import React from 'react';
import { Modal } from '../Modal';
import { History, TrendingUp, TrendingDown, Calendar, User, FileText, Wallet } from 'lucide-react';
import { Avatar } from '../Avatar';

interface SalaryHistory {
  id: string;
  employeeId: string;
  previousSalary: number;
  newSalary: number;
  changeReason: string;
  effectiveDate: string;
  modifiedBy: string;
  createdAt: Date;
}

interface SalaryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  history: SalaryHistory[];
}

export function SalaryHistoryModal({ isOpen, onClose, employee, history }: SalaryHistoryModalProps) {
  const sortedHistory = [...history].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historique des Salaires"
      size="lg"
    >
      <div className="space-y-6">
        {/* Employee Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Avatar 
              firstName={employee.employeeName.split(' ')[0] || ''} 
              lastName={employee.employeeName.split(' ')[1] || ''} 
              size="md" 
              showPhoto={true}
            />
            <div>
              <h3 className="font-bold text-blue-900">{employee.employeeName}</h3>
              <p className="text-blue-700 text-sm">{employee.position}</p>
              <p className="text-blue-600 text-xs">{employee.department}</p>
            </div>
          </div>
        </div>

        {/* Current Salary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Salaire Actuel</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{employee.netSalary.toLocaleString()} Ar</p>
              <p className="text-sm text-green-700">Net mensuel</p>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Historique des Modifications
          </h4>
          
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun historique de modification disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((entry, index) => {
                const isIncrease = entry.newSalary > entry.previousSalary;
                const changeAmount = Math.abs(entry.newSalary - entry.previousSalary);
                const changePercentage = entry.previousSalary > 0 ? 
                  ((entry.newSalary - entry.previousSalary) / entry.previousSalary) * 100 : 0;

                return (
                  <div key={entry.id} className="relative">
                    {/* Timeline line */}
                    {index < sortedHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isIncrease ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isIncrease ? (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(entry.effectiveDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            isIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isIncrease ? 'Augmentation' : 'Diminution'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Ancien salaire:</p>
                            <p className="font-medium text-gray-900">{entry.previousSalary.toLocaleString()} Ar</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Nouveau salaire:</p>
                            <p className="font-medium text-gray-900">{entry.newSalary.toLocaleString()} Ar</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Variation:</span>
                            <div className="text-right">
                              <span className={`font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                {isIncrease ? '+' : '-'}{changeAmount.toLocaleString()} Ar
                              </span>
                              <span className={`ml-2 text-xs ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                ({isIncrease ? '+' : ''}{changePercentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Raison:</span>
                            <span className="font-medium text-gray-900">{entry.changeReason}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Modifié par:</span>
                            <span className="font-medium text-gray-900">{entry.modifiedBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {sortedHistory.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Statistiques</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Nombre de modifications:</p>
                <p className="font-bold text-gray-900">{sortedHistory.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Dernière modification:</p>
                <p className="font-bold text-gray-900">
                  {new Date(sortedHistory[0].effectiveDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Évolution totale:</p>
                <p className={`font-bold ${
                  employee.baseSalary > (sortedHistory[sortedHistory.length - 1]?.previousSalary || 0) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sortedHistory.length > 0 ? (
                    ((employee.baseSalary - (sortedHistory[sortedHistory.length - 1]?.previousSalary || 0)) / (sortedHistory[sortedHistory.length - 1]?.previousSalary || 1) * 100).toFixed(1)
                  ) : 0}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}