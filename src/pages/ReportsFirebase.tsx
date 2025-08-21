import React, { useState } from 'react';
import { Download, Filter, BarChart3, PieChart, TrendingUp, Calendar, FileText, Users, Award } from 'lucide-react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { reportsService } from '../lib/firebase/firebaseService';
import { useAuth } from '../hooks/useAuth';

interface Report {
  id?: string;
  title: string;
  description: string;
  type: 'academic' | 'attendance' | 'financial' | 'behavioral';
  generated: string;
  size: string;
  format: 'PDF' | 'Excel' | 'Word';
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const typeColors = {
  academic: 'bg-blue-100 text-blue-800',
  attendance: 'bg-green-100 text-green-800',
  financial: 'bg-yellow-100 text-yellow-800',
  behavioral: 'bg-red-100 text-red-800'
};

const typeLabels = {
  academic: 'Académique',
  attendance: 'Assiduité',
  financial: 'Financier',
  behavioral: 'Comportement'
};

const formatColors = {
  PDF: 'bg-red-50 text-red-600',
  Excel: 'bg-green-50 text-green-600',
  Word: 'bg-blue-50 text-blue-600'
};

export function ReportsFirebase() {
  const { profile } = useAuth();
  const [selectedType, setSelectedType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Hook Firebase avec synchronisation temps réel
  const {
    data: reports,
    loading,
    error,
    creating,
    update,
    remove,
    create
  } = useFirebaseCollection<Report>(reportsService, true);

  const filteredReports = reports.filter(report => {
    const matchesType = selectedType === '' || report.type === selectedType;
    return matchesType;
  });

  const handleQuickReport = async (type: string) => {
    try {
      const creatorName = profile ? `${profile.firstName} ${profile.lastName}` : 'Administrateur';
      
      switch (type) {
        case 'bulletin':
          const bulletinId = await reportsService.generateGradesReport('6ème A', 'Trimestre 1', creatorName);
          alert(`Bulletin de notes généré avec l'ID: ${bulletinId}`);
          break;
        case 'attendance':
          const reportData = {
            title: 'Rapport d\'Assiduité - Novembre',
            description: 'Analyse des présences et absences par classe',
            type: 'attendance' as const,
            generated: new Date().toISOString().split('T')[0],
            size: '1.1 MB',
            format: 'Excel' as const,
            createdBy: creatorName
          };
          const attendanceId = await create(reportData);
          alert(`Rapport d'assiduité généré avec l'ID: ${attendanceId}`);
          break;
        case 'statistics':
          const statsData = {
            title: 'Statistiques de Classe - 5ème B',
            description: 'Analyse complète des performances de la classe',
            type: 'academic' as const,
            generated: new Date().toISOString().split('T')[0],
            size: '3.2 MB',
            format: 'PDF' as const,
            createdBy: creatorName
          };
          const statsId = await create(statsData);
          alert(`Statistiques de classe générées avec l'ID: ${statsId}`);
          break;
        case 'teachers':
          const teachersData = {
            title: 'Rapport Enseignants - Novembre',
            description: 'Évaluation et suivi des enseignants',
            type: 'behavioral' as const,
            generated: new Date().toISOString().split('T')[0],
            size: '2.8 MB',
            format: 'Word' as const,
            createdBy: creatorName
          };
          const teachersId = await create(teachersData);
          alert(`Rapport enseignants généré avec l'ID: ${teachersId}`);
          break;
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleDownload = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      alert(`Téléchargement de "${report.title}" en cours...`);
    }
  };

  const handleNewReport = () => {
    alert('Création d\'un nouveau rapport personnalisé...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Rapports et Statistiques</h1>
          <p className="text-gray-600">Générez et consultez les rapports de l'établissement</p>
        </div>
        
        <button 
          onClick={handleNewReport}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Nouveau Rapport
        </button>
      </div>

      {/* Quick Report Generation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Génération Rapide</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickReport('bulletin')}
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <Award className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Bulletin de Notes</p>
          </button>
          
          <button 
            onClick={() => handleQuickReport('attendance')}
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <Calendar className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Rapport Assiduité</p>
          </button>
          
          <button 
            onClick={() => handleQuickReport('statistics')}
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <BarChart3 className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600">Statistiques Classe</p>
          </button>
          
          <button 
            onClick={() => handleQuickReport('teachers')}
            className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all group"
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Rapport Enseignants</p>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="academic">Académique</option>
            <option value="attendance">Assiduité</option>
            <option value="financial">Financier</option>
            <option value="behavioral">Comportement</option>
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les périodes</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rapports Générés</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ce Mois</p>
              <p className="text-2xl font-bold text-green-600">
                {reports.filter(r => {
                  const now = new Date();
                  const reportDate = new Date(r.generated);
                  return reportDate.getMonth() === now.getMonth() && 
                         reportDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Téléchargements</p>
              <p className="text-2xl font-bold text-purple-600">89</p>
            </div>
            <Download className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taille Totale</p>
              <p className="text-2xl font-bold text-orange-600">
                {reports.length > 0 ? 
                  (reports.reduce((acc, r) => acc + parseFloat(r.size.replace(' MB', '')), 0)).toFixed(1) + ' MB' 
                  : '0 MB'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Rapports Récents</h2>
        </div>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport généré</h3>
            <p className="text-gray-500 mb-6">Commencez par générer votre premier rapport.</p>
            <button
              onClick={() => handleQuickReport('bulletin')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer un Rapport
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{report.title}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[report.type]}`}>
                            {typeLabels[report.type]}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatColors[report.format]}`}>
                            {report.format}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Généré le {new Date(report.generated).toLocaleDateString('fr-FR')}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                          <span>•</span>
                          <span>Par {report.createdBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => report.id && handleDownload(report.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </button>
                    
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <PieChart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Dashboard Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Aperçu Analytique</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Voir tableau de bord complet
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mock Chart 1 */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Évolution des Notes</h3>
            <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 rounded flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <span className="ml-2 text-blue-600 text-sm">Graphique des moyennes</span>
            </div>
          </div>
          
          {/* Mock Chart 2 */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Répartition par Classe</h3>
            <div className="h-32 bg-gradient-to-r from-green-50 to-green-100 rounded flex items-center justify-center">
              <PieChart className="w-8 h-8 text-green-400" />
              <span className="ml-2 text-green-600 text-sm">Graphique circulaire</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}