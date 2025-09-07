import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, Calendar, MapPin, Phone, FileText, CheckSquare, Square, AlertTriangle, DollarSign } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StudentFormFirebase } from '../components/forms/StudentFormFirebase';
import { CertificateModal } from '../components/certificates/CertificateModal';
import { Avatar } from '../components/Avatar';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { studentsService } from '../lib/firebase/firebaseService';
import { logout } from '../lib/auth';

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  class: string;
  address: string;
  phone: string;
  parentName: string;
  parentEmail?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export function StudentsFirebase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: students,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Student>(studentsService, true);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.class.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === '' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const classes = [...new Set(students.map(s => s.class))];

  const handleAddStudent = async (data: any) => {
    try {
      await create(data);
      setShowAddForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'élève:', error);
    }
  };

  const handleEditStudent = async (data: any) => {
    if (selectedStudent?.id) {
      try {
        await update(selectedStudent.id, data);
        setShowEditForm(false);
        setSelectedStudent(null);
      } catch (error) {
        console.error('Erreur lors de la modification de l\'élève:', error);
      }
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      try {
        await remove(id);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'élève:', error);
      }
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setShowEditForm(true);
  };

  const handleGenerateCertificate = (student: Student) => {
    setSelectedStudent(student);
    setShowCertificateModal(true);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) {
        return prev.filter(studentId => studentId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.filter(s => s.id).map(s => s.id as string));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedStudents.length > 0) {
      setShowConfirmModal(true);
    }
  };

  const confirmDeleteSelected = async () => {
    try {
      for (const id of selectedStudents) {
        await remove(id);
      }
      setSelectedStudents([]);
      setShowConfirmModal(false);
      alert(`✅ ${selectedStudents.length} élève(s) supprimé(s) avec succès !`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression des élèves:', error);
      alert('❌ Erreur lors de la suppression des élèves: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des élèves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Gestion des Élèves</h1>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Gérez les informations des élèves de l'école</p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
          <button
            onClick={handleLogout}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "20" : "16"} height={isMobile ? "20" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Déconnexion
          </button>
          <button
            onClick={() => {
              console.log('🔘 Ouverture du formulaire d\'ajout d\'élève');
              setShowAddForm(true);
            }}
            disabled={creating}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
          >
            {creating ? (
              <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
            ) : (
              <Plus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
            )}
            Ajouter un Élève
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-4'}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Toutes les classes</option>
              {classes.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
            
            <button className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}>
              <Filter className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Students Stats */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3 mb-4' : 'grid-cols-1 md:grid-cols-4 gap-4 mb-4'}`}>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Élèves</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{students.length}</p>
            </div>
            <Users className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Actifs</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>{students.filter(s => s.status === 'active').length}</p>
            </div>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-green-100 rounded-full flex items-center justify-center`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-green-600 rounded-full`}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Inactifs</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-orange-600`}>{students.filter(s => s.status === 'inactive').length}</p>
            </div>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-orange-100 rounded-full flex items-center justify-center`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-orange-600 rounded-full`}></div>
            </div>
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-4 border border-gray-100 ${isMobile ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Classes</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>{classes.length}</p>
            </div>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-purple-100 rounded-full flex items-center justify-center`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-purple-600 rounded-full`}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection Tools */}
      {students.length > 0 && (
        <div className={`bg-white ${isMobile ? 'rounded-lg p-3' : 'rounded-xl p-4'} shadow-sm border border-gray-100 mb-4 flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
          <div className={`flex items-center ${isMobile ? 'justify-between' : ''}`}>
            <button 
              onClick={handleSelectAll}
              className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2`}
            >
              {selectedStudents.length === filteredStudents.length ? (
                <CheckSquare className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
              ) : (
                <Square className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
              )}
            </button>
            <span className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
              {selectedStudents.length} élève(s) sélectionné(s)
            </span>
          </div>
          
          <button
            onClick={handleDeleteSelected}
            disabled={selectedStudents.length === 0}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-2.5 text-sm w-full' : 'px-3 py-1.5'} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Trash2 className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Supprimer la sélection
          </button>
        </div>
      )}

      {/* Students Table */}
      <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100 overflow-hidden`}>
        {students.length === 0 ? (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <Users className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>Aucun élève enregistré</h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>Commencez par ajouter votre premier élève à l'école.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`inline-flex items-center ${isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Ajouter un Élève
            </button>
          </div>
        ) : (
          <div className={`${isMobile ? 'overflow-x-auto' : 'overflow-x-auto'}`}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={`${isMobile ? 'py-2 px-1' : 'py-3 px-2'} font-medium text-gray-900 w-10`}></th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Élève</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900 ${isMobile ? 'hidden sm:table-cell' : ''}`}>Classe</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900 ${isMobile ? 'hidden md:table-cell' : ''}`}>Date de Naissance</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900 ${isMobile ? 'hidden lg:table-cell' : ''}`}>Parent/Tuteur</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900 ${isMobile ? 'hidden xl:table-cell' : ''}`}>Contact</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900 ${isMobile ? 'hidden sm:table-cell' : ''}`}>Statut</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${isMobile ? 'py-3 px-1' : 'py-4 px-2'} text-center`}>
                      <button
                        onClick={() => student.id && handleSelectStudent(student.id)}
                        className={`${isMobile ? 'p-1.5' : 'p-1'} text-gray-400 hover:text-blue-600 rounded transition-colors`}
                      >
                        {student.id && selectedStudents.includes(student.id) ? (
                          <CheckSquare className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-blue-600`} />
                        ) : (
                          <Square className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                        )}
                      </button>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          firstName={student.firstName} 
                          lastName={student.lastName} 
                          size={isMobile ? "sm" : "md"}
                          showPhoto={true}
                        />
                        <div>
                          <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{student.firstName} {student.lastName}</p>
                          <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                            <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} mr-1`} />
                            {student.address.split(',')[0]}
                          </div>
                          {/* Afficher la classe sur mobile */}
                          {isMobile && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {student.class}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium bg-blue-100 text-blue-800 rounded-full`}>
                        {student.class}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden md:table-cell' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>
                        <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 text-gray-400`} />
                        {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden lg:table-cell' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{student.parentName}</p>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden xl:table-cell' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                        <Phone className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 text-gray-400`} />
                        {student.phone}
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <button 
                          onClick={() => handleViewStudent(student)}
                          className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                          title="Voir les détails"
                        >
                          <Eye className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(student)}
                          disabled={updating}
                          className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50`}
                          title="Modifier"
                        >
                          <Edit className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                        </button>
                        {!isMobile && (
                          <>
                            <button 
                              onClick={() => student.id && handleDeleteStudent(student.id)}
                              disabled={deleting}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleGenerateCertificate(student)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Certificat de scolarité"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Menu mobile pour les actions supplémentaires */}
                        {isMobile && (
                          <div className="relative">
                            <button 
                              onClick={() => {
                                // Afficher un menu contextuel mobile
                                const actions = [
                                  { label: 'Supprimer', action: () => student.id && handleDeleteStudent(student.id), color: 'text-red-600' },
                                  { label: 'Certificat', action: () => handleGenerateCertificate(student), color: 'text-purple-600' }
                                ];
                                
                                const actionText = actions.map(a => a.label).join(' | ');
                                if (confirm(`Actions disponibles: ${actionText}. Que souhaitez-vous faire ?`)) {
                                  // Logique simplifiée pour mobile
                                  handleGenerateCertificate(student);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Plus d'actions"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Ajouter un Élève"
        size={isMobile ? "xl" : "lg"}
      >
        <StudentFormFirebase
          onSubmit={handleAddStudent}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedStudent(null);
        }}
        title="Modifier l'Élève"
        size={isMobile ? "xl" : "lg"}
      >
        {selectedStudent && (
          <StudentFormFirebase
            onSubmit={handleEditStudent}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedStudent(null);
            }}
            initialData={selectedStudent}
          />
        )}
      </Modal>

      {/* View Student Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedStudent(null);
        }}
        title="Détails de l'Élève"
        size={isMobile ? "xl" : "lg"}
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar 
                firstName={selectedStudent.firstName} 
                lastName={selectedStudent.lastName} 
                size={isMobile ? "md" : "lg"}
                showPhoto={true}
              />
              <div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>{selectedStudent.class}</p>
              </div>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Informations personnelles</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Date de naissance:</span> {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Adresse:</span> {selectedStudent.address}</p>
                  <p><span className="font-medium">Téléphone:</span> {selectedStudent.phone}</p>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Informations scolaires</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Classe:</span> {selectedStudent.class}</p>
                  <p><span className="font-medium">Parent/Tuteur:</span> {selectedStudent.parentName}</p>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${
                      selectedStudent.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions rapides */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'}`}>Actions rapides</h4>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-3'}`}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleGenerateCertificate(selectedStudent);
                  }}
                  className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors`}
                >
                  <FileText className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
                  Certificat de scolarité
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedStudent);
                  }}
                  className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
                >
                  <Edit className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}
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
      
      {/* Confirmation Modal for Bulk Delete */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmation de suppression"
        size={isMobile ? "lg" : "md"}
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-red-100 flex items-center justify-center`}>
              <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`} />
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>Êtes-vous sûr de vouloir supprimer ces élèves ?</h3>
              <p className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                Vous êtes sur le point de supprimer {selectedStudents.length} élève(s). Cette action est irréversible.
              </p>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end space-x-3'} mt-6`}>
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDeleteSelected}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
            >
              Confirmer la suppression
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}