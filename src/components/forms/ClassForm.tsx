import React, { useState, useEffect } from 'react';
import { School, Users, User, MapPin } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { teachersService } from '../../lib/firebase/firebaseService';

interface ClassFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function ClassForm({ onSubmit, onCancel, initialData }: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    level: initialData?.level || '',
    teacher: initialData?.teacher || '',
    maxCapacity: initialData?.maxCapacity || 20,
    room: initialData?.room || '',
    status: initialData?.status || 'active'
  });
  
  // Hook Firebase pour charger les enseignants en temps réel
  const { data: teachers, loading } = useFirebaseCollection(teachersService, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <School className="w-4 h-4 inline mr-2" />
            Nom de la classe
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="ex: TPSA, 6ème A"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Sélectionner un niveau</option>
            <optgroup label="Maternelle">
              <option value="Très Petite Section">Très Petite Section (2-3 ans)</option>
              <option value="Petite Section">Petite Section (3-4 ans)</option>
              <option value="Moyenne Section">Moyenne Section (4-5 ans)</option>
              <option value="Grande Section">Grande Section (5-6 ans)</option>
            </optgroup>
            <optgroup label="Primaire">
              <option value="CP">CP (6-7 ans)</option>
              <option value="CE1">CE1 (7-8 ans)</option>
              <option value="CE2">CE2 (8-9 ans)</option>
              <option value="CM1">CM1 (9-10 ans)</option>
              <option value="CM2">CM2 (10-11 ans)</option>
            </optgroup>
            <optgroup label="Spécialisé">
              <option value="Classe Spécialisée">Classe Spécialisée</option>
              <option value="Garderie">Garderie</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Enseignant principal
          </label>
          <select
            name="teacher"
            value={formData.teacher}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Sélectionner un enseignant</option>
            {loading ? (
              <option disabled>Chargement des enseignants...</option>
            ) : (
              teachers.map(teacher => (
                <option key={teacher.id} value={`${teacher.firstName} ${teacher.lastName}`}>
                  {teacher.firstName} {teacher.lastName} - {teacher.subject}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Capacité maximale
          </label>
          <input
            type="number"
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleChange}
            min="10"
            max="35"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Salle de classe
          </label>
          <input
            type="text"
            name="room"
            value={formData.room}
            onChange={handleChange}
            placeholder="ex: Salle TPS A"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          {initialData ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}