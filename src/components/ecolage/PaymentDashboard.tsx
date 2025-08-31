import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { feesService, studentsService, classesService } from '../../lib/firebase/firebaseService';
import { StudentPaymentDetails } from './StudentPaymentDetails';

interface ClassPaymentSummary {
  className: string;
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  paymentRate: number;
  studentsWithOverdue: number;
}

interface PaymentDashboardProps {
  selectedClass?: string;
  academicYear?: string;
}

export function PaymentDashboard({ selectedClass = '', academicYear = '2024-2025' }: PaymentDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [classSummaries, setClassSummaries] = useState<ClassPaymentSummary[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState(selectedClass);

  // Hooks Firebase
  const { data: payments, loading: paymentsLoading } = useFirebaseCollection(feesService, true);
  const { data: students, loading: studentsLoading } = useFirebaseCollection(studentsService, true);
  const { data: classes, loading: classesLoading } = useFirebaseCollection(classesService, true);

  // Calculer les résumés par classe
  useEffect(() => {
    if (students.length > 0 && payments.length > 0) {
      const summaries = calculateClassSummaries();
      setClassSummaries(summaries);
    }
  }, [students, payments, academicYear]);

  const calculateClassSummaries = (): ClassPaymentSummary[] => {
    const classNames = [...new Set(students.map(s => s.class))];
    
    return classNames.map(className => {
      const classStudents = students.filter(s => s.class === className);
      const classPayments = payments.filter(p => p.class === className);
      
      // Montant mensuel standard selon la classe
      const getMonthlyAmount = (cls: string): number => {
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
        return classAmounts[cls] || 150000;
      };

      const monthlyAmount = getMonthlyAmount(className);
      const totalDue = classStudents.length * monthlyAmount * 10; // 10 mois
      const totalPaid = classPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalOverdue = classPayments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
      
      // Compter les élèves avec des retards
      const studentsWithOverdue = classStudents.filter(student => {
        const studentPayments = classPayments.filter(p => 
          p.studentName === `${student.firstName} ${student.lastName}`
        );
        return studentPayments.some(p => p.status === 'overdue');
      }).length;

      return {
        className,
        totalStudents: classStudents.length,
        totalDue,
        totalPaid,
        totalOverdue,
        paymentRate,
        studentsWithOverdue
      };
    });
  };

  const handleViewStudentDetails = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleExportClassReport = (className: string) => {
    const classStudents = students.filter(s => s.class === className);
    const classPayments = payments.filter(p => p.class === className);
    
    const csvContent = [
      'Élève,Classe,Parent,Total Dû,Total Payé,Solde,Statut',
      ...classStudents.map(student => {
        const studentPayments = classPayments.filter(p => 
          p.studentName === `${student.firstName} ${student.lastName}`
        );
        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
        const monthlyAmount = 150000; // Simplifié
        const totalDue = monthlyAmount * 10;
        const balance = totalDue - totalPaid;
        const hasOverdue = studentPayments.some(p => p.status === 'overdue');
        
        return [
          `${student.firstName} ${student.lastName}`,
          student.class,
          student.parentName,
          totalDue,
          totalPaid,
          balance,
          hasOverdue ? 'En retard' : balance === 0 ? 'À jour' : 'En cours'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_ecolage_${className}_${academicYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (paymentsLoading || studentsLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const filteredSummaries = selectedClassFilter ? 
    classSummaries.filter(s => s.className === selectedClassFilter) : 
    classSummaries;

  const globalStats = classSummaries.reduce((acc, summary) => ({
    totalStudents: acc.totalStudents + summary.totalStudents,
    totalDue: acc.totalDue + summary.totalDue,
    totalPaid: acc.totalPaid + summary.totalPaid,
    totalOverdue: acc.totalOverdue + summary.totalOverdue,
    studentsWithOverdue: acc.studentsWithOverdue + summary.studentsWithOverdue
  }), { totalStudents: 0, totalDue: 0, totalPaid: 0, totalOverdue: 0, studentsWithOverdue: 0 });

  const globalPaymentRate = globalStats.totalDue > 0 ? (globalStats.totalPaid / globalStats.totalDue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tableau de Bord des Paiements</h2>
          <p className="text-gray-600">Vue d'ensemble des paiements d'écolage par classe</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.name}>{cls.name} - {cls.level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Élèves</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collecté</p>
              <p className="text-2xl font-bold text-green-600">{globalStats.totalPaid.toLocaleString()} Ar</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Retard</p>
              <p className="text-2xl font-bold text-red-600">{globalStats.studentsWithOverdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux Global</p>
              <p className="text-2xl font-bold text-blue-600">{globalPaymentRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Class Summaries */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Résumé par Classe</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Classe</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Élèves</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Total Dû</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Total Payé</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Taux</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">En Retard</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSummaries.map((summary, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-medium text-gray-900">{summary.className}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600">{summary.totalStudents}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-gray-900">{summary.totalDue.toLocaleString()} Ar</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-green-600">{summary.totalPaid.toLocaleString()} Ar</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            summary.paymentRate >= 90 ? 'bg-green-500' :
                            summary.paymentRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(summary.paymentRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {summary.paymentRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {summary.studentsWithOverdue > 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">{summary.studentsWithOverdue}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">0</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExportClassReport(summary.className)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Exporter rapport de classe"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Afficher la liste détaillée des élèves de cette classe
                          alert(`Affichage détaillé de la classe ${summary.className}`);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students with Payment Issues */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Élèves avec Retards de Paiement
          </h3>
          <span className="text-sm text-gray-600">
            {globalStats.studentsWithOverdue} élève(s) concerné(s)
          </span>
        </div>
        
        {globalStats.studentsWithOverdue === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-600 font-medium">Aucun retard de paiement !</p>
            <p className="text-gray-500 text-sm">Tous les élèves sont à jour dans leurs paiements.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students
              .filter(student => {
                const studentPayments = payments.filter(p => 
                  p.studentName === `${student.firstName} ${student.lastName}` && p.status === 'overdue'
                );
                return studentPayments.length > 0;
              })
              .slice(0, 10) // Limiter à 10 pour l'affichage
              .map((student, index) => {
                const overduePayments = payments.filter(p => 
                  p.studentName === `${student.firstName} ${student.lastName}` && p.status === 'overdue'
                );
                const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-600">{student.class} • {overduePayments.length} paiement(s) en retard</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-red-600">{overdueAmount.toLocaleString()} Ar</p>
                      <button
                        onClick={() => handleViewStudentDetails(student)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Student Payment Details Modal */}
      {selectedStudent && (
        <StudentPaymentDetails
          isOpen={showStudentDetails}
          onClose={() => {
            setShowStudentDetails(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
        />
      )}
    </div>
  );
}