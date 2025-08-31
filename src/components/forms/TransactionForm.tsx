import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, FileText, Tag } from 'lucide-react';

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  isSubmitting?: boolean;
}

export function TransactionForm({ onSubmit, onCancel, initialData, isSubmitting = false }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'Encaissement',
    category: initialData?.category || '',
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    paymentMethod: initialData?.paymentMethod || 'Espèces',
    status: initialData?.status || 'Validé',
    reference: initialData?.reference || '',
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const encaissementCategories = [
    'Écolages',
    'Frais d\'inscription',
    'Frais d\'examen',
    'Activités extra-scolaires',
    'Cantine',
    'Transport scolaire',
    'Fournitures scolaires',
    'Uniformes',
    'Autres recettes'
  ];

  const decaissementCategories = [
    'Salaires',
    'Charges sociales',
    'Fournitures',
    'Charges',
    'Maintenance',
    'Formation',
    'Assurances',
    'Impôts et taxes',
    'Frais bancaires',
    'Autres dépenses'
  ];

  const paymentMethods = [
    'Espèces',
    'Virement',
    'Mobile Money',
    'Chèque',
    'Carte bancaire'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.category) newErrors.category = 'La catégorie est requise';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Le montant doit être supérieur à 0';
    if (!formData.date) newErrors.date = 'La date est requise';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log('📤 Soumission des données de transaction:', formData);
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Reset category when type changes
    if (name === 'type') {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  };

  const currentCategories = formData.type === 'Encaissement' ? encaissementCategories : decaissementCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de transaction *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'Encaissement', category: '' }))}
              className={`p-3 border-2 rounded-lg transition-all ${
                formData.type === 'Encaissement'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Encaissement</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'Décaissement', category: '' }))}
              className={`p-3 border-2 rounded-lg transition-all ${
                formData.type === 'Décaissement'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <TrendingDown className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Décaissement</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-2" />
            Catégorie *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner une catégorie</option>
            {currentCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-600 text-xs mt-1">{errors.category}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Description *
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Description détaillée de la transaction"
          />
          {errors.description && (
            <p className="text-red-600 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Montant (Ariary) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="100"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.amount ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="ex: 120000"
          />
          {errors.amount && (
            <p className="text-red-600 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="text-red-600 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Mode de paiement
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Validé">Validé</option>
            <option value="En attente">En attente</option>
            <option value="Annulé">Annulé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Référence
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ex: TXN-2025-001"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notes additionnelles..."
          />
        </div>
      </div>

      {/* Preview */}
      {formData.amount && (
        <div className={`p-4 rounded-lg border-2 ${
          formData.type === 'Encaissement' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {formData.type === 'Encaissement' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                formData.type === 'Encaissement' ? 'text-green-800' : 'text-red-800'
              }`}>
                {formData.type}: {formData.category}
              </span>
            </div>
            <span className={`text-xl font-bold ${
              formData.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formData.type === 'Encaissement' ? '+' : '-'}{parseFloat(formData.amount).toLocaleString()} Ar
            </span>
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {initialData ? 'Modification...' : 'Enregistrement...'}
            </div>
          ) : (
            initialData ? 'Modifier' : 'Enregistrer'
          )}
        </button>
      </div>
    </form>
  );
}