import React from 'react';
import { Search, Filter, SortAsc, SortDesc, Calendar, Tag, CheckCircle } from 'lucide-react';

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
  sortBy: 'date' | 'amount' | 'type';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'date' | 'amount' | 'type') => void;
  isMobile?: boolean;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
  sortBy,
  sortOrder,
  onSortChange,
  isMobile = false
}: TransactionFiltersProps) {
  return (
    <>
      {/* Navigation Tabs */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-1'}`}>
          <button
            onClick={() => onTypeChange('')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === '' 
                ? 'bg-blue-600 text-white border-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent'
            }`}
          >
            Toutes les Transactions
          </button>
          <button
            onClick={() => onTypeChange('Encaissement')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === 'Encaissement' 
                ? 'bg-green-600 text-white border-2 border-green-600' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 border-2 border-transparent'
            }`}
          >
            Encaissements
          </button>
          <button
            onClick={() => onTypeChange('Décaissement')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === 'Décaissement' 
                ? 'bg-red-600 text-white border-2 border-red-600' 
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-2 border-transparent'
            }`}
          >
            Décaissements
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col lg:flex-row gap-4'}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Tous les statuts</option>
              <option value="Validé">Validé</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
            
            {/* Sort Controls */}
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-1'}`}>
              <button
                onClick={() => onSortChange('date')}
                className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} border rounded-lg transition-colors ${
                  sortBy === 'date' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-1'} inline`} />
                Date
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? 
                    <SortDesc className="w-3 h-3 ml-1 inline" /> : 
                    <SortAsc className="w-3 h-3 ml-1 inline" />
                )}
              </button>
              
              <button
                onClick={() => onSortChange('amount')}
                className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} border rounded-lg transition-colors ${
                  sortBy === 'amount' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <DollarSign className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-1'} inline`} />
                Montant
                {sortBy === 'amount' && (
                  sortOrder === 'desc' ? 
                    <SortDesc className="w-3 h-3 ml-1 inline" /> : 
                    <SortAsc className="w-3 h-3 ml-1 inline" />
                )}
              </button>
              
              <button
                onClick={() => onSortChange('type')}
                className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} border rounded-lg transition-colors ${
                  sortBy === 'type' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Tag className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-1'} inline`} />
                Type
                {sortBy === 'type' && (
                  sortOrder === 'desc' ? 
                    <SortDesc className="w-3 h-3 ml-1 inline" /> : 
                    <SortAsc className="w-3 h-3 ml-1 inline" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}