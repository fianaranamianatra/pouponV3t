import React from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, Award, MessageCircle, AlertTriangle, Plus } from 'lucide-react';
// import { DataInitializer } from '../components/admin/DataInitializer';
import { FinancialSyncStatus } from '../components/financial/FinancialSyncStatus';

const stats = [
  {
    label: 'Total Élèves',
    value: '1,247',
    change: '+12%',
    icon: Users,
    color: 'blue',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    label: 'Enseignants',
    value: '89',
    change: '+3%',
    icon: GraduationCap,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    label: 'Classes Actives',
    value: '42',
    change: '+5%',
    icon: BookOpen,
    color: 'orange',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
  },
  {
    label: 'Taux de Réussite',
    value: '94.2%',
    change: '+2.1%',
    icon: TrendingUp,
    color: 'green',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600'
  }
];

const recentActivities = [
  {
    id: 1,
    type: 'student',
    message: 'Nouvel élève inscrit: Marie Dubois',
    time: 'Il y a 2 heures',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    id: 2,
    type: 'grade',
    message: 'Notes de mathématiques publiées pour la 6ème A',
    time: 'Il y a 4 heures',
    icon: Award,
    color: 'text-green-600'
  },
  {
    id: 3,
    type: 'communication',
    message: 'Nouveau message des parents - Classe 5ème B',
    time: 'Il y a 6 heures',
    icon: MessageCircle,
    color: 'text-purple-600'
  },
  {
    id: 4,
    type: 'alert',
    message: 'Absence non justifiée: Jean Martin',
    time: 'Il y a 8 heures',
    icon: AlertTriangle,
    color: 'text-orange-600'
  }
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Réunion Parents-Professeurs',
    date: '25 Nov 2024',
    time: '14:00 - 17:00',
    type: 'meeting'
  },
  {
    id: 2,
    title: 'Évaluation Trimestrielle',
    date: '28 Nov 2024',
    time: '08:00 - 12:00',
    type: 'exam'
  },
  {
    id: 3,
    title: 'Formation Enseignants',
    date: '2 Déc 2024',
    time: '13:00 - 16:00',
    type: 'training'
  },
  {
    id: 4,
    title: 'Spectacle de Fin d\'Année',
    date: '15 Déc 2024',
    time: '19:00 - 21:00',
    type: 'event'
  }
];

export function Dashboard() {
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Bienvenue sur LES POUPONS</h1>
        <p className="text-blue-100 text-lg">
          Tableau de bord de gestion scolaire - {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change} ce mois</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-sm text-green-600 font-medium">{stat.change || '+0%'} ce mois</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Activités Récentes</h2>
            <button 
              onClick={() => handleViewAll('activities')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Voir tout
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Événements à Venir</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="font-medium text-gray-900 text-sm">{event.title}</h3>
                <p className="text-xs text-gray-500">{event.date}</p>
                <p className="text-xs text-blue-600 font-medium">{event.time}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleViewAll('calendar')}
            className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            Voir le calendrier complet
          </button>
        </div>
      </div>

      {/* Data Initializer - Admin Panel */}
      {/* <DataInitializer /> */}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('add-student')}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Ajouter Élève</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('add-teacher')}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <GraduationCap className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">Ajouter Enseignant</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('create-class')}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
          >
            <BookOpen className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Créer Classe</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('send-message')}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <MessageCircle className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">Envoyer Message</span>
          </button>
        </div>
      </div>

      {/* Quick Financial Sync Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">État de Synchronisation Financière</h2>
        <FinancialSyncStatus compact={false} showActions={true} />
      </div>
    </div>
  );
}