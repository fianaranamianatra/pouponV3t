import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, GraduationCap, Mail, Phone, BookOpen } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TeacherFormFirebase } from '../components/forms/TeacherFormFirebase';
import { Avatar } from '../components/Avatar';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { teachersService } from '../lib/firebase/firebaseService';

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  classes?: string[];
  experience: number;
  status: 'CDI' | 'CDD' | 'FRAM';
  entryDate?: string;
  retirementDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function TeachersFirebase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: teachers,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Teacher>(teachersService, true);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === '' || teacher.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = [...new Set(teachers.map(t => t.subject))];

  const handleAddTeacher = async (data: any) => {
    try {
      console.log('🚀 Ajout d\'enseignant - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const teacherData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        experience: parseInt(data.experience) || 0,
        status: data.status || 'active',
        classes: [] // Initialiser avec un tableau vide
      };
      
      console.log('📝 Données formatées pour Firebase:', teacherData);
      
      const teacherId = await create(teacherData);
      console.log('✅ Enseignant créé avec l\'ID:', teacherId);
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Enseignant ajouté avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de l\'enseignant:', error);
      alert('❌ Erreur lors de l\'ajout de l\'enseignant: ' + error.message);
    }
  };

  const handleEditTeacher = async (data: any) => {
    if (selectedTeacher?.id) {
      try {
        console.log('🔄 Modification d\'enseignant - Données:', data);
        
        const updateData = {
          ...data,
          experience: parseInt(data.experience) || 0
        };
        
        await update(selectedTeacher.id, updateData);
        console.log('✅ Enseignant modifié avec succès');
        
        setShowEditForm(false);
        setSelectedTeacher(null);
        
        alert('✅ Enseignant modifié avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      try {
        console.log('🗑️ Suppression de l\'enseignant ID:', id);
        await remove(id);
        console.log('✅ Enseignant supprimé avec succès');
        alert('✅ Enseignant supprimé avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des enseignants...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Enseignants</h1>
          <p className="text-gray-600">Gérez le personnel enseignant de l'école</p>
        </div>
        
        <button
          onClick={() => {
            console.log('🔘 Ouverture du formulaire d\'ajout d\'enseignant');
            setShowAddForm(true);
          }}
          disabled={creating}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Ajouter un Enseignant
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un enseignant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Toutes les matières</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Teachers Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Enseignants</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CDI</p>
              <p className="text-2xl font-bold text-green-600">{teachers.filter(t => t.status === 'CDI').length}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Matières</p>
              <p className="text-2xl font-bold text-blue-600">{subjects.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Exp. Moyenne</p>
              <p className="text-2xl font-bold text-purple-600">
                {teachers.length > 0 ? Math.round(teachers.reduce((acc, t) => acc + t.experience, 0) / teachers.length) : 0} ans
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enseignant enregistré</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter votre premier enseignant à l'école.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Enseignant
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Enseignant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Âge</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Matière</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Classes</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Expérience</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          firstName={teacher.firstName} 
                          lastName={teacher.lastName} 
                          size="md" 
                          showPhoto={true}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-3 h-3 mr-1" />
                            {teacher.email || 'Pas d\'email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {teacher.dateOfBirth ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {(() => {
                                const today = new Date();
                                const birthDate = new Date(teacher.dateOfBirth);
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                return age;
                              })()} ans
                            </p>
                            <p className="text-xs text-gray-500">
                              Né(e) le {new Date(teacher.dateOfBirth).toLocaleDateString('fr-FR')}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-500">Non renseigné</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {teacher.subject}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {teacher.classes && teacher.classes.length > 0 ? (
                          <>
                            {teacher.classes.slice(0, 2).map((className, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {className}
                              </span>
                            ))}
                            {teacher.classes.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{teacher.classes.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Aucune classe assignée</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {teacher.phone || 'Pas de téléphone'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{teacher.experience} ans</p>
                        {teacher.entryDate && (
                          <p className="text-xs text-gray-500">
                            Depuis {new Date(teacher.entryDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teacher.status === 'CDI' 
                          ? 'bg-green-100 text-green-800' 
                          : teacher.status === 'CDD'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewTeacher(teacher)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(teacher)}
                          disabled={updating}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => teacher.id && handleDeleteTeacher(teacher.id)}
                          disabled={deleting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => {
          console.log('❌ Fermeture du formulaire d\'ajout');
          setShowAddForm(false);
        }}
        title="Ajouter un Enseignant"
        size="lg"
      >
        <TeacherFormFirebase
          onSubmit={handleAddTeacher}
          onCancel={() => {
            console.log('❌ Annulation de l\'ajout');
            setShowAddForm(false);
          }}
        />
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedTeacher(null);
        }}
        title="Modifier l'Enseignant"
        size="lg"
      >
        {selectedTeacher && (
          <TeacherFormFirebase
            onSubmit={handleEditTeacher}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedTeacher(null);
            }}
            initialData={selectedTeacher}
          />
        )}
      </Modal>

      {/* View Teacher Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTeacher(null);
        }}
        title="Détails de l'Enseignant"
        size="lg"
      >
        {selectedTeacher && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar 
                firstName={selectedTeacher.firstName} 
                lastName={selectedTeacher.lastName} 
                size="lg" 
                showPhoto={true}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </h3>
                <p className="text-gray-600">{selectedTeacher.subject}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations de contact</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Date de naissance:</span> {selectedTeacher.dateOfBirth ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
                  <p><span className="font-medium">Âge:</span> {selectedTeacher.dateOfBirth ? (() => {
                    const today = new Date();
                    const birthDate = new Date(selectedTeacher.dateOfBirth);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  })() + ' ans' : 'Non calculé'}</p>
                  <p><span className="font-medium">Email:</span> {selectedTeacher.email || 'Pas d\'email'}</p>
                  <p><span className="font-medium">Téléphone:</span> {selectedTeacher.phone || 'Pas de téléphone'}</p>
                  <p><span className="font-medium">Expérience:</span> {selectedTeacher.experience} ans</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations pédagogiques</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Matière principale:</span> {selectedTeacher.subject}</p>
                  <p><span className="font-medium">Classes:</span></p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTeacher.classes && selectedTeacher.classes.length > 0 ? (
                      selectedTeacher.classes.map((className, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {className}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Aucune classe assignée</span>
                    )}
                  </div>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedTeacher.status === 'CDI' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedTeacher.status === 'CDD'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedTeacher.status}
                    </span>
                  </p>
                  {selectedTeacher.entryDate && (
                    <p><span className="font-medium">Date d'entrée:</span> {new Date(selectedTeacher.entryDate).toLocaleDateString('fr-FR')}</p>
                  )}
                  {selectedTeacher.retirementDate && (
                    <p><span className="font-medium">Date de retraite prévue:</span> {new Date(selectedTeacher.retirementDate).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}