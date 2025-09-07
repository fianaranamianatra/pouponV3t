import React from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, Award, MessageCircle, AlertTriangle, Plus, DollarSign, Zap, Activity, Calculator, Trash2 } from 'lucide-react';
// import { DataInitializer } from '../components/admin/DataInitializer';
import { FinancialSyncStatus } from '../components/financial/FinancialSyncStatus';
import { PaymentAlerts } from '../components/ecolage/PaymentAlerts';
import { EcolageStudentSync } from '../components/ecolage/EcolageStudentSync';
import { GlobalSyncStatus } from '../components/sync/GlobalSyncStatus';
import { PayrollSalarySyncPanel } from '../components/payroll/PayrollSalarySyncPanel';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';

const stats = [
  {
    label: 'Total Élèves',
    value: '0',
    change: '0%',
    icon: Users,
    color: 'blue',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Enseignants',
    value: '0',
    change: '0%',
    icon: GraduationCap,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    label: 'Classes Actives',
    value: '0',
    change: '0%',
    icon: BookOpen,
    color: 'orange',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
  },
  {
    label: 'Taux de Réussite',
    value: '0%',
    change: '0%',
    icon: TrendingUp,
    color: 'green',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600'
  }
];

const recentActivities: any[] = [];

const upcomingEvents: any[] = [];

export function Dashboard() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-student':
        alert('Redirection vers l\'ajout d\'élève...');
        break;
      case 'add-teacher':
        alert('Redirection vers l\'ajout d\'enseignant...');
        break;
      case 'create-class':
        alert('Redirection vers la création de classe...');
        break;
      case 'send-message':
        alert('Redirection vers l\'envoi de message...');
        break;
    }
  };

  const handleViewAll = (section: string) => {
    switch (section) {
      case 'activities':
        alert('Affichage de toutes les activités...');
        break;
      case 'calendar':
        alert('Ouverture du calendrier complet...');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className={`bg-gradient-to-r from-blue-600 to-blue-700 ${isMobile ? 'rounded-xl p-6' : 'rounded-2xl p-8'} text-white`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-2`}>Bienvenue sur LES POUPONS</h1>
        <p className={`text-blue-100 ${isMobile ? 'text-base' : 'text-lg'}`}>
          Tableau de bord de gestion scolaire - {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 mb-1`}>{stat.label}</p>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{stat.value}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-600 font-medium`}>{stat.change} ce mois</p>
                </div>
                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-6'}`}>
        {/* Recent Activities */}
        <div className={`${isMobile ? '' : 'lg:col-span-2'} bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Activités Récentes</h2>
            <button 
              onClick={() => handleViewAll('activities')}
              className={`text-blue-600 hover:text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'} font-medium transition-colors`}
            >
              Voir tout
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune activité récente</p>
                <p className="text-gray-400 text-xs">Les activités apparaîtront ici une fois que vous commencerez à utiliser l'application</p>
              </div>
            ) : (
              recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className={`flex items-start space-x-3 ${isMobile ? 'p-2' : 'p-3'} rounded-lg hover:bg-gray-50 transition-colors cursor-pointer`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{activity.message}</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{activity.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Événements à Venir</h2>
            <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-gray-400`} />
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun événement programmé</p>
                <p className="text-gray-400 text-xs">Ajoutez des événements pour les voir apparaître ici</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className={`border-l-4 border-blue-500 ${isMobile ? 'pl-3 py-2' : 'pl-4 py-2'} hover:bg-gray-50 transition-colors cursor-pointer`}>
                  <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>{event.title}</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{event.date}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 font-medium`}>{event.time}</p>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => handleViewAll('calendar')}
            className={`w-full mt-4 ${isMobile ? 'px-3 py-2.5' : 'px-4 py-2'} bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}
            disabled={upcomingEvents.length === 0}
          >
            {upcomingEvents.length === 0 ? 'Aucun événement' : 'Voir le calendrier complet'}
          </button>
        </div>
      </div>

      {/* Data Initializer - Admin Panel */}
      {/* <DataInitializer /> */}

      {/* Quick Actions */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'}`}>Actions Rapides</h2>
        
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
          <button 
            onClick={() => handleQuickAction('add-student')}
            className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group`}
          >
            <Users className={`${isMobile ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'} text-gray-400 group-hover:text-blue-600`} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 group-hover:text-blue-600 text-center`}>Ajouter Élève</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('add-teacher')}
            className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group`}
          >
            <GraduationCap className={`${isMobile ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'} text-gray-400 group-hover:text-green-600`} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 group-hover:text-green-600 text-center`}>Ajouter Enseignant</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('create-class')}
            className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group`}
          >
            <BookOpen className={`${isMobile ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'} text-gray-400 group-hover:text-orange-600`} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 group-hover:text-orange-600 text-center`}>Créer Classe</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('send-message')}
            className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group`}
          >
            <MessageCircle className={`${isMobile ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'} text-gray-400 group-hover:text-purple-600`} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 group-hover:text-purple-600 text-center`}>Envoyer Message</span>
          </button>
        </div>
      </div>

      {/* Quick Financial Sync Status */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'}`}>État de Synchronisation Financière</h2>
        <FinancialSyncStatus compact={false} showActions={true} />
      </div>

      {/* Payment Alerts */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <DollarSign className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-600`} />
          Alertes de Paiement
        </h2>
        <PaymentAlerts />
      </div>

      {/* Synchronisation Écolage-Profils */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Zap className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-green-600`} />
          Synchronisation Écolage ↔ Profils Étudiants
        </h2>
        <EcolageStudentSync />
      </div>

      {/* Statut de Synchronisation Globale */}
      {/* Synchronisation Paie ↔ Salaires */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Calculator className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-purple-600`} />
          Synchronisation Paie ↔ Salaires
        </h2>
        <PayrollSalarySyncPanel compact={false} />
      </div>

      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Activity className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-purple-600`} />
          Statut de Synchronisation Globale
        </h2>
        <GlobalSyncStatus />
      </div>

      {/* Nettoyage des Données Financières */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-600`} />
          Gestion des Données Financières
        </h2>
        <FinancialDataCleanup />
      </div>
    </div>
  );
}