import React, { useState } from 'react';
import { User, Users, MessageCircle, AlertCircle } from 'lucide-react';

interface MessageFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function MessageForm({ onSubmit, onCancel, initialData }: MessageFormProps) {
  const [formData, setFormData] = useState({
    recipient: initialData?.recipient || '',
    recipientType: initialData?.recipientType || 'individual',
    subject: initialData?.subject || '',
    content: initialData?.content || '',
    priority: initialData?.priority || 'medium',
    type: initialData?.type || 'admin'
  });

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de destinataire
          </label>
          <select
            name="recipientType"
            value={formData.recipientType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="individual">Individuel</option>
            <option value="class">Classe entière</option>
            <option value="all_parents">Tous les parents</option>
            <option value="all_teachers">Tous les enseignants</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.recipientType === 'individual' ? (
              <>
                <User className="w-4 h-4 inline mr-2" />
                Destinataire
              </>
            ) : (
              <>
                <Users className="w-4 h-4 inline mr-2" />
                Groupe destinataire
              </>
            )}
          </label>
          {formData.recipientType === 'individual' ? (
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sélectionner un destinataire</option>
              <option value="Sophie Martin">Sophie Martin (Parent)</option>
              <option value="Catherine Moreau">Catherine Moreau (Enseignant)</option>
              <option value="Jean-Pierre Durand">Jean-Pierre Durand (Enseignant)</option>
              <option value="Michel Bernard">Michel Bernard (Parent)</option>
            </select>
          ) : formData.recipientType === 'class' ? (
            <select
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sélectionner une classe</option>
              <option value="6ème A">6ème A</option>
              <option value="6ème B">6ème B</option>
              <option value="5ème A">5ème A</option>
              <option value="5ème B">5ème B</option>
              <option value="4ème A">4ème A</option>
            </select>
          ) : (
            <input
              type="text"
              value={formData.recipientType === 'all_parents' ? 'Tous les parents' : 'Tous les enseignants'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Sujet
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Objet du message..."
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={6}
            placeholder="Contenu du message..."
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Priorité
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de message
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="admin">Administration</option>
              <option value="teacher">Enseignant</option>
              <option value="parent">Parent</option>
            </select>
          </div>
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
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Envoyer
        </button>
      </div>
    </form>
  );
}