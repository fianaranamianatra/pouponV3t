import React, { useState, useEffect } from 'react';
import { User, CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { studentsService, classesService } from '../../lib/firebase/firebaseService';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  students?: any[];
  classes?: any[];
}

export function PaymentForm({ onSubmit, onCancel, initialData, students = [], classes = [] }: PaymentFormProps) {
  // Hooks Firebase pour charger les données en temps réel si pas fournies
  const { data: firebaseStudents, loading: studentsLoading } = useFirebaseCollection(studentsService, true);
  const { data: firebaseClasses, loading: classesLoading } = useFirebaseCollection(classesService, true);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Utiliser les données fournies ou celles de Firebase
  const finalStudents = students.length > 0 ? students : firebaseStudents;
  const finalClasses = classes.length > 0 ? classes : firebaseClasses;

  const [formData, setFormData] = useState({
    studentName: initialData?.studentName || '',
    class: initialData?.class || '',
    amount: initialData?.amount || '',
    paymentMethod: initialData?.paymentMethod || 'cash',
    paymentDate: initialData?.paymentDate || new Date().toISOString().split('T')[0],
    period: initialData?.period || '',
    reference: initialData?.reference || '',
    notes: initialData?.notes || ''
  });

  // Mettre à jour la classe lorsque l'élève change
  useEffect(() => {
    if (formData.studentName && finalStudents.length > 0) {
      const selectedStudent = finalStudents.find(s => `${s.firstName} ${s.lastName}` === formData.studentName);
      if (selectedStudent && selectedStudent.class !== formData.class) {
        setFormData(prev => ({
          ...prev,
          class: selectedStudent.class
        }));
      }
    }
  }, [formData.studentName, finalStudents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Élève
          </label>
          {finalStudents.length > 0 ? (
            <select
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              required
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Sélectionner un élève</option>
              {finalStudents.map(student => (
                <option key={student.id} value={`${student.firstName} ${student.lastName}`}>
                  {student.firstName} {student.lastName} - {student.class}
                </option>
              ))}
            </select>
          ) : (
            <select
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              required
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">{studentsLoading ? 'Chargement des élèves...' : 'Aucun élève disponible'}</option>
            </select>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Classe
          </label>
          {finalClasses.length > 0 ? (
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              required
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Sélectionner une classe</option>
              {finalClasses.map(classItem => (
                <option key={classItem.id} value={classItem.name}>
                  {classItem.name} - {classItem.level}
                </option>
              ))}
            </select>
          ) : (
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              required
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">{classesLoading ? 'Chargement des classes...' : 'Aucune classe disponible'}</option>
            </select>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <DollarSign className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Montant (Ariary)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="ex: 500000"
            required
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <CreditCard className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Mode de paiement
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          >
            <option value="cash">Espèces</option>
            <option value="bank_transfer">Virement bancaire</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="check">Chèque</option>
          </select>
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Date de paiement
          </label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            required
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Période
          </label>
          <select
            name="period"
            value={formData.period}
            onChange={handleChange}
            required
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          >
            <option value="">Sélectionner une période</option>
            <option value="Janvier">Janvier</option>
            <option value="Février">Février</option>
            <option value="Mars">Mars</option>
            <option value="Avril">Avril</option>
            <option value="Mai">Mai</option>
            <option value="Juin">Juin</option>
            <option value="Juillet">Juillet</option>
            <option value="Août">Août</option>
            <option value="Septembre">Septembre</option>
            <option value="Octobre">Octobre</option>
            <option value="Novembre">Novembre</option>
            <option value="Décembre">Décembre</option>
          </select>
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <FileText className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Référence
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="ex: PAY-2024-001"
            required
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>

        <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={isMobile ? 2 : 3}
            placeholder="Notes additionnelles..."
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col gap-3 pt-4' : 'space-x-3 pt-4'}`}>
        <button
          type="button"
          onClick={onCancel}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
        >
          Annuler
        </button>
        <button
          type="submit"
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
        >
          {initialData ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}