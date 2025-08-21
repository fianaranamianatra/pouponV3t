import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Clock, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Modal } from '../components/Modal';
import { SubjectForm } from '../components/forms/SubjectForm';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { subjectsService, teachersService } from '../lib/firebase/firebaseService';

interface Subject {
  id?: string;
  name: string;
  code: string;
  description: string;
  hoursPerWeek: number;
  teachers: string[];
  classes: string[];
  color: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  red: 'bg-red-100 text-red-800 border-red-200'
};

export function SubjectsFirebase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: subjects,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Subject>(subjectsService, true);

  // Charger les données des enseignants
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        console.log('🔄 Chargement des enseignants...');
        const teachersData = await teachersService.getAll();
        setAllTeachers(teachersData);
        console.log('✅ Enseignants chargés:', teachersData.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des enseignants:', error);
      }
    };
    
    fetchTeachers();
  }, []);

  const filteredSubjects = subjects.filter(subject => {
    return subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           subject.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Fonction pour obtenir le nom complet d'un enseignant
  const getTeacherName = (teacherId: string) => {
    const teacher = allTeachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherId;
  };

  const handleAddSubject = async (data: any) => {
    try {
      console.log('🚀 Ajout de matière - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const subjectData = {
        name: data.name,
        code: data.code,
        description: data.description || '',
        hoursPerWeek: parseInt(data.hoursPerWeek) || 3,
        color: data.color || 'blue',
        status: data.status || 'active',
        teachers: [],
        classes: []
      };
      
      console.log('📝 Données formatées pour Firebase:', subjectData);
      
      const subjectId = await create(subjectData);
      console.log('✅ Matière créée avec l\'ID:', subjectId);
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Matière ajoutée avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de la matière:', error);
      alert('❌ Erreur lors de l\'ajout de la matière: ' + error.message);
    }
  };

  const handleEditSubject = async (data: any) => {
    if (selectedSubject?.id) {
      try {
        console.log('🔄 Modification de matière - Données:', data);
        
        const updateData = {
          ...data,
          hoursPerWeek: parseInt(data.hoursPerWeek) || 3
        };
        
        await update(selectedSubject.id, updateData);
        console.log('✅ Matière modifiée avec succès');
        
        setShowEditForm(false);
        setSelectedSubject(null);
        
        alert('✅ Matière modifiée avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      try {
        console.log('🗑️ Suppression de la matière ID:', id);
        await remove(id);
        console.log('✅ Matière supprimée avec succès');
        alert('✅ Matière supprimée avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowViewModal(true);
  };

  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des matières...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Matières</h1>
          <p className="text-gray-600">Gérez le programme pédagogique de l'école</p>
        </div>
        
        <button
          onClick={() => {
            console.log('🔘 Ouverture du formulaire d\'ajout de matière');
            setShowAddForm(true);
          }}
          disabled={creating}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Ajouter une Matière
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une matière..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Subjects Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Matières</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-2xl font-bold text-green-600">{subjects.filter(s => s.status === 'active').length}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Heures/Semaine</p>
              <p className="text-2xl font-bold text-blue-600">{subjects.reduce((acc, s) => acc + s.hoursPerWeek, 0)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enseignants</p>
              <p className="text-2xl font-bold text-orange-600">
                {[...new Set(subjects.flatMap(s => s.teachers))].length}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune matière enregistrée</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter votre première matière au programme.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une Matière
            </button>
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[subject.color as keyof typeof colorClasses]}`}>
                      {subject.code}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subject.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subject.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{subject.name}</h3>
                  <p className="text-sm text-gray-600">{subject.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Hours per week */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{subject.hoursPerWeek}h par semaine</span>
                </div>

                {/* Teachers */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Enseignants:</span>
                  </div>
                  <div className="ml-6">
                    {subject.teachers && subject.teachers.length > 0 ? (
                      subject.teachers.map((teacher, index) => (
                        <p key={index} className="text-sm text-gray-600">{getTeacherName(teacher)}</p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Aucun enseignant assigné</p>
                    )}
                  </div>
                </div>

                {/* Classes */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Classes:</span>
                  </div>
                  <div className="ml-6 flex flex-wrap gap-1">
                    {subject.classes && subject.classes.length > 0 ? (
                      <>
                        {subject.classes.slice(0, 3).map((className, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {className}
                          </span>
                        ))}
                        {subject.classes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{subject.classes.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Aucune classe assignée</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewSubject(subject)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditClick(subject)}
                    disabled={updating}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => subject.id && handleDeleteSubject(subject.id)}
                    disabled={deleting}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => handleViewSubject(subject)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Emploi du temps
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Ajouter une Matière"
        size="lg"
      >
        <SubjectForm
          onSubmit={handleAddSubject}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedSubject(null);
        }}
        title="Modifier la Matière"
        size="lg"
      >
        {selectedSubject && (
          <SubjectForm
            onSubmit={handleEditSubject}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedSubject(null);
            }}
            initialData={selectedSubject}
          />
        )}
      </Modal>

      {/* View Subject Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSubject(null);
        }}
        title="Détails de la Matière"
        size="lg"
      >
        {selectedSubject && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClasses[selectedSubject.color as keyof typeof colorClasses]}`}>
                <span className="font-bold text-xl">
                  {selectedSubject.code}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedSubject.name}</h3>
                <p className="text-gray-600">{selectedSubject.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Code:</span> {selectedSubject.code}</p>
                  <p><span className="font-medium">Heures par semaine:</span> {selectedSubject.hoursPerWeek}h</p>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedSubject.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedSubject.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Enseignants et Classes</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Enseignants:</p>
                    {selectedSubject.teachers && selectedSubject.teachers.length > 0 ? (
                      selectedSubject.teachers.map((teacher, index) => (
                        <p key={index} className="ml-2 text-gray-600">• {getTeacherName(teacher)}</p>
                      ))
                    ) : (
                      <p className="ml-2 text-gray-500">Aucun enseignant assigné</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Classes:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSubject.classes && selectedSubject.classes.length > 0 ? (
                        selectedSubject.classes.map((className, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {className}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Aucune classe assignée</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}