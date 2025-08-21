import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, GraduationCap, BookOpen } from 'lucide-react';
import { Modal } from '../components/Modal';
import { ClassForm } from '../components/forms/ClassForm';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { classesService, studentsService, teachersService } from '../lib/firebase/firebaseService';

interface Class {
  id?: string;
  name: string;
  level: string;
  teacher: string;
  studentCount: number;
  maxCapacity: number;
  room: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export function ClassesFirebase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: classes,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Class>(classesService, true);

  // Charger les données liées (élèves et enseignants)
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        console.log('🔄 Chargement des données liées (élèves et enseignants)...');
        
        // Récupérer les élèves
        const studentsData = await studentsService.getAll();
        setStudents(studentsData);
        console.log('✅ Élèves chargés:', studentsData.length);
        
        // Récupérer les enseignants
        const teachersData = await teachersService.getAll();
        setTeachers(teachersData);
        console.log('✅ Enseignants chargés:', teachersData.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données liées:', error);
      }
    };
    
    fetchRelatedData();
  }, []);

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === '' || classItem.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const levels = [...new Set(classes.map(c => c.level))];

  // Fonction pour obtenir le nom complet d'un enseignant
  const getTeacherName = (teacherName: string) => {
    const teacher = teachers.find(t => 
      `${t.firstName} ${t.lastName}` === teacherName
    );
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherName;
  };

  // Fonction pour obtenir les élèves d'une classe
  const getStudentsInClass = (className: string) => {
    return students.filter(s => s.class === className);
  };

  const handleAddClass = async (data: any) => {
    try {
      console.log('🚀 Ajout de classe - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const classData = {
        name: data.name,
        level: data.level,
        teacher: data.teacher,
        maxCapacity: parseInt(data.maxCapacity) || 20,
        room: data.room,
        status: data.status || 'active',
        studentCount: 0
      };
      
      console.log('📝 Données formatées pour Firebase:', classData);
      
      const classId = await create(classData);
      console.log('✅ Classe créée avec l\'ID:', classId);
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Classe ajoutée avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de la classe:', error);
      alert('❌ Erreur lors de l\'ajout de la classe: ' + error.message);
    }
  };

  const handleEditClass = async (data: any) => {
    if (selectedClass?.id) {
      try {
        console.log('🔄 Modification de classe - Données:', data);
        
        const updateData = {
          ...data,
          maxCapacity: parseInt(data.maxCapacity) || 20
        };
        
        await update(selectedClass.id, updateData);
        console.log('✅ Classe modifiée avec succès');
        
        setShowEditForm(false);
        setSelectedClass(null);
        
        alert('✅ Classe modifiée avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      try {
        console.log('🗑️ Suppression de la classe ID:', id);
        await remove(id);
        console.log('✅ Classe supprimée avec succès');
        alert('✅ Classe supprimée avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleViewClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowViewModal(true);
  };

  const handleEditClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des classes...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
          <p className="text-gray-600">Organisez et gérez les classes de l'école</p>
        </div>
        
        <button
          onClick={() => {
            console.log('🔘 Ouverture du formulaire d\'ajout de classe');
            setShowAddForm(true);
          }}
          disabled={creating}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Créer une Classe
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
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Tous les niveaux</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Élèves Total</p>
              <p className="text-2xl font-bold text-blue-600">{classes.reduce((acc, c) => acc + c.studentCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Capacité Totale</p>
              <p className="text-2xl font-bold text-green-600">{classes.reduce((acc, c) => acc + c.maxCapacity, 0)}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Niveaux</p>
              <p className="text-2xl font-bold text-purple-600">{levels.length}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune classe enregistrée</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter votre première classe à l'école.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une Classe
            </button>
          </div>
        ) : (
          filteredClasses.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
                  <p className="text-sm text-gray-600">{classItem.level}</p>
                  <p className="text-xs text-gray-500">{classItem.room}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  classItem.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {classItem.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Teacher */}
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getTeacherName(classItem.teacher) || 'Enseignant non assigné'}
                  </span>
                </div>

                {/* Student Count */}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getStudentsInClass(classItem.name).length}/{classItem.maxCapacity} élèves
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${classItem.maxCapacity > 0 ? (getStudentsInClass(classItem.name).length / classItem.maxCapacity) * 100 : 0}%` }}
                  ></div>
                </div>

                {/* Age Group Indicator */}
                <div className="text-xs text-gray-500">
                  {classItem.level === 'Très Petite Section' && '2-3 ans'}
                  {classItem.level === 'Petite Section' && '3-4 ans'}
                  {classItem.level === 'Moyenne Section' && '4-5 ans'}
                  {classItem.level === 'Grande Section' && '5-6 ans'}
                  {classItem.level === 'CP' && '6-7 ans'}
                  {classItem.level === 'CE1' && '7-8 ans'}
                  {classItem.level === 'CE2' && '8-9 ans'}
                  {classItem.level === 'CM1' && '9-10 ans'}
                  {classItem.level === 'CM2' && '10-11 ans'}
                  {(classItem.level === 'Classe Spécialisée' || classItem.level === 'Garderie') && 'Tous âges'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewClass(classItem)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditClick(classItem)}
                    disabled={updating}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => classItem.id && handleDeleteClass(classItem.id)}
                    disabled={deleting}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => handleViewClass(classItem)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Détails
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Créer une Classe"
        size="lg"
      >
        <ClassForm
          onSubmit={handleAddClass}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedClass(null);
        }}
        title="Modifier la Classe"
        size="lg"
      >
        {selectedClass && (
          <ClassForm
            onSubmit={handleEditClass}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedClass(null);
            }}
            initialData={selectedClass}
          />
        )}
      </Modal>

      {/* View Class Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedClass(null);
        }}
        title="Détails de la Classe"
        size="lg"
      >
        {selectedClass && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {selectedClass.name}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedClass.name}</h3>
                <p className="text-gray-600">{selectedClass.level}</p>
                <p className="text-sm text-gray-500">{selectedClass.room}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Niveau:</span> {selectedClass.level}</p>
                  <p><span className="font-medium">Enseignant principal:</span> {getTeacherName(selectedClass.teacher) || 'Non assigné'}</p>
                  <p><span className="font-medium">Salle:</span> {selectedClass.room}</p>
                  <p><span className="font-medium">Capacité:</span> {getStudentsInClass(selectedClass.name).length}/{selectedClass.maxCapacity} élèves</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Statut et informations</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedClass.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedClass.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p><span className="font-medium">Taux d'occupation:</span> {selectedClass.maxCapacity > 0 ? Math.round((getStudentsInClass(selectedClass.name).length / selectedClass.maxCapacity) * 100) : 0}%</p>
                  <p><span className="font-medium">Places disponibles:</span> {selectedClass.maxCapacity - getStudentsInClass(selectedClass.name).length}</p>
                </div>
              </div>
              
              {/* Liste des élèves */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Élèves dans cette classe</h4>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {getStudentsInClass(selectedClass.name).length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {getStudentsInClass(selectedClass.name).map(student => (
                        <li key={student.id} className="py-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span>{student.firstName} {student.lastName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm py-2">Aucun élève dans cette classe</p>
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