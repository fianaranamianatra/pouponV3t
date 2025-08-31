import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Mail, Phone, Calendar, User, DollarSign, Send } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { feesService, studentsService } from '../../lib/firebase/firebaseService';
import { Avatar } from '../Avatar';

interface OverduePayment {
  student: any;
  overduePayments: any[];
  totalOverdueAmount: number;
  daysSinceLastPayment: number;
  contactInfo: {
    parentName: string;
    phone: string;
    email?: string;
  };
}

interface PaymentAlertsProps {
  className?: string;
}

export function PaymentAlerts({ className = '' }: PaymentAlertsProps) {
  const [overdueStudents, setOverdueStudents] = useState<OverduePayment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Hooks Firebase
  const { data: payments } = useFirebaseCollection(feesService, true);
  const { data: students } = useFirebaseCollection(studentsService, true);

  // Calculer les élèves avec des retards
  useEffect(() => {
    if (students.length > 0 && payments.length > 0) {
      const overdueList = calculateOverdueStudents();
      setOverdueStudents(overdueList);
    }
  }, [students, payments]);

  const calculateOverdueStudents = (): OverduePayment[] => {
    const today = new Date();
    const overdueList: OverduePayment[] = [];

    students.forEach(student => {
      const studentPayments = payments.filter(p => 
        p.studentName === `${student.firstName} ${student.lastName}`
      );

      const overduePayments = studentPayments.filter(p => {
        if (p.status !== 'overdue') return false;
        const dueDate = new Date(p.paymentDate);
        return today > dueDate;
      });

      if (overduePayments.length > 0) {
        const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Calculer les jours depuis le dernier paiement
        const lastPayment = studentPayments
          .filter(p => p.status === 'paid')
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
        
        const daysSinceLastPayment = lastPayment ? 
          Math.floor((today.getTime() - new Date(lastPayment.paymentDate).getTime()) / (1000 * 60 * 60 * 24)) : 
          999;

        overdueList.push({
          student,
          overduePayments,
          totalOverdueAmount,
          daysSinceLastPayment,
          contactInfo: {
            parentName: student.parentName,
            phone: student.phone,
            email: student.parentEmail
          }
        });
      }
    });

    // Trier par montant dû décroissant
    return overdueList.sort((a, b) => b.totalOverdueAmount - a.totalOverdueAmount);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === overdueStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(overdueStudents.map(o => o.student.id));
    }
  };

  const handleSendReminders = async () => {
    if (selectedStudents.length === 0) {
      alert('Veuillez sélectionner au moins un élève');
      return;
    }

    setSendingReminders(true);
    
    try {
      // Simuler l'envoi de rappels
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`✅ Rappels envoyés à ${selectedStudents.length} parent(s)`);
      setSelectedStudents([]);
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi des rappels');
    } finally {
      setSendingReminders(false);
    }
  };

  const getPriorityLevel = (overdue: OverduePayment): 'high' | 'medium' | 'low' => {
    if (overdue.daysSinceLastPayment > 60 || overdue.totalOverdueAmount > 500000) {
      return 'high';
    } else if (overdue.daysSinceLastPayment > 30 || overdue.totalOverdueAmount > 300000) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Important';
      case 'low': return 'Normal';
      default: return 'Normal';
    }
  };

  if (overdueStudents.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium text-green-800 mb-2">Aucun Retard de Paiement</h3>
          <p className="text-green-600 text-sm">Tous les élèves sont à jour dans leurs paiements d'écolage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="font-medium text-gray-900">Alertes de Paiement</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {overdueStudents.length} élève(s)
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {selectedStudents.length === overdueStudents.length ? 'Désélectionner tout' : 'Sélectionner tout'}
          </button>
          <button
            onClick={handleSendReminders}
            disabled={selectedStudents.length === 0 || sendingReminders}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {sendingReminders ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer Rappels ({selectedStudents.length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {overdueStudents.map((overdue, index) => {
          const priority = getPriorityLevel(overdue);
          
          return (
            <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(priority)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(overdue.student.id)}
                    onChange={() => handleSelectStudent(overdue.student.id)}
                    className="rounded border-gray-300"
                  />
                  
                  <Avatar 
                    firstName={overdue.student.firstName} 
                    lastName={overdue.student.lastName} 
                    size="sm" 
                    showPhoto={true}
                  />
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {overdue.student.firstName} {overdue.student.lastName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                        {getPriorityLabel(priority)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{overdue.student.class}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {overdue.daysSinceLastPayment} jours
                      </span>
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {overdue.contactInfo.parentName}
                      </span>
                      <span className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {overdue.contactInfo.phone}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {overdue.totalOverdueAmount.toLocaleString()} Ar
                  </p>
                  <p className="text-sm text-gray-600">
                    {overdue.overduePayments.length} paiement(s) en retard
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => {
                        // Appeler directement le parent
                        window.open(`tel:${overdue.contactInfo.phone}`);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Appeler le parent"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    {overdue.contactInfo.email && (
                      <button
                        onClick={() => {
                          // Envoyer un email
                          window.open(`mailto:${overdue.contactInfo.email}?subject=Rappel de paiement - ${overdue.student.firstName} ${overdue.student.lastName}`);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Envoyer un email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {selectedStudents.length} élève(s) sélectionné(s) • 
            Total dû: {overdueStudents
              .filter(o => selectedStudents.includes(o.student.id))
              .reduce((sum, o) => sum + o.totalOverdueAmount, 0)
              .toLocaleString()} Ar
          </span>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Générer un rapport des retards
                alert('Génération du rapport de retards en cours...');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Générer Rapport
            </button>
            <button
              onClick={() => {
                // Programmer des rappels automatiques
                alert('Configuration des rappels automatiques...');
              }}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Rappels Auto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}