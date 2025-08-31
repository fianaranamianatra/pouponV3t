import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import StudentForm from '../components/forms/StudentFormFirebase';
import Modal from '../components/Modal';
import { Search, Plus, Edit, Trash2, Users, GraduationCap, CreditCard, FileText } from 'lucide-react';
import { StudentPaymentSummary } from '../components/students/StudentPaymentSummary';
import { StudentFinancialWidget } from '../components/students/StudentFinancialWidget';
import { StudentSyncIndicator } from '../components/students/StudentSyncIndicator';
import { CertificateModal } from '../components/certificates/CertificateModal';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  classId: string;
  className?: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalInfo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Class {
  id: string;
  name: string;
  level: string;
}

export default function StudentsFirebase() {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to students
    const studentsQuery = query(
      collection(db, 'students'),
      orderBy('lastName', 'asc')
    );

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Student[];
      setStudents(studentsData);
      setLoading(false);
    });

    // Subscribe to classes
    const classesQuery = query(
      collection(db, 'classes'),
      orderBy('name', 'asc')
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Class[];
      setClasses(classesData);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeClasses();
    };
  }, [user]);

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleEditStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingStudent) return;

    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        ...studentData,
        updatedAt: new Date(),
      });
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!canDelete || !confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) return;

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesClass = classFilter === 'all' || student.classId === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getClassName = (classId: string) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.name : 'Classe non trouvée';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', color: 'bg-red-100 text-red-800' },
      graduated: { label: 'Diplômé', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8 text-indigo-600" />
            Gestion des Étudiants
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les informations des étudiants et leur suivi académique
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Étudiant
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="graduated">Diplômé</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Toutes les classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {filteredStudents.length} étudiant(s)
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{getClassName(student.classId)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StudentSyncIndicator studentId={student.id} />
                  {getStatusBadge(student.status)}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Téléphone:</strong> {student.phone}</p>
                <p><strong>Parent:</strong> {student.parentName}</p>
                <p><strong>Inscription:</strong> {new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Financial Widget */}
              <StudentFinancialWidget studentId={student.id} />

              {/* Payment Summary */}
              <StudentPaymentSummary studentId={student.id} />

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title="Voir les détails"
                  >
                    <CreditCard className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowCertificateModal(true);
                    }}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Certificats"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(student)}
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun étudiant trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || classFilter !== 'all'
              ? 'Aucun étudiant ne correspond aux critères de recherche.'
              : 'Commencez par ajouter un nouvel étudiant.'}
          </p>
          {canCreate && !searchTerm && statusFilter === 'all' && classFilter === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4 inline" />
                Ajouter un étudiant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStudent ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
      >
        <StudentForm
          student={editingStudent}
          classes={classes}
          onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
          onCancel={closeModal}
        />
      </Modal>

      {/* Certificate Modal */}
      {selectedStudent && (
        <CertificateModal
          isOpen={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
        />
      )}
    </div>
  );
}