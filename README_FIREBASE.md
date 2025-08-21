# Configuration Firebase pour LES POUPONS

## Configuration initiale

### 1. Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou utilisez le projet existant `poupons-d7979`
3. Activez Firestore Database
4. Activez Authentication

### 2. Configuration Firestore

#### Règles de sécurité
Copiez le contenu du fichier `firestore.rules` dans les règles Firestore de votre console Firebase.

#### Collections créées automatiquement
- `students` - Informations des élèves
- `teachers` - Informations des enseignants  
- `classes` - Informations des classes
- `subjects` - Matières enseignées
- `grades` - Notes et évaluations
- `payments` - Paiements d'écolage
- `schedule` - Emploi du temps
- `messages` - Communications
- `reports` - Rapports générés
- `employees` - Personnel de l'école
- `certificates` - Certificats émis
- `users` - Profils utilisateurs

### 3. Configuration Authentication

#### Méthodes d'authentification activées
- Email/Mot de passe
- Comptes de démonstration

#### Utilisateurs de test
Créez ces comptes dans Authentication :
- `admin@lespoupons.mg` (Administrateur)
- `directeur@lespoupons.mg` (Directeur)
- `enseignant@lespoupons.mg` (Enseignant)

### 4. Variables d'environnement

Créez un fichier `.env` avec vos clés Firebase :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=poupons-d7979.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=poupons-d7979
VITE_FIREBASE_STORAGE_BUCKET=poupons-d7979.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=748366685258
VITE_FIREBASE_APP_ID=1:748366685258:web:327e8baa8b0d0a502d32b3
```

## Fonctionnalités implémentées

### ✅ Gestion des élèves
- Ajout/modification/suppression avec validation
- Synchronisation temps réel
- Recherche et filtrage
- Génération de certificats de scolarité

### ✅ Gestion des enseignants
- CRUD complet avec validation
- Assignation aux matières
- Gestion des classes

### ✅ Gestion des notes
- Saisie des évaluations
- Calcul automatique des moyennes
- Validation des notes (ne peut pas dépasser le maximum)

### ✅ Gestion des paiements
- Enregistrement des paiements d'écolage
- Suivi des statuts (payé/en attente/en retard)
- Génération de références uniques
- Statistiques financières

### ✅ Validation des données
- Validation côté client et serveur
- Règles de sécurité Firestore
- Messages d'erreur en français

### ✅ Synchronisation temps réel
- Mise à jour automatique des données
- Notifications de changements
- Gestion des états de chargement

## Utilisation

### Démarrage
```bash
npm install
npm run dev
```

### Mode démonstration
L'application fonctionne en mode démonstration sans authentification pour les tests.

### Mode production
Configurez les variables d'environnement et activez l'authentification.

## Sécurité

- Authentification requise pour toutes les opérations
- Validation des données côté client et serveur
- Règles Firestore strictes
- Chiffrement des données en transit

## Performance

- Requêtes optimisées avec index
- Pagination automatique
- Cache local
- Synchronisation temps réel efficace

## Support

Pour toute question technique, consultez la documentation Firebase ou contactez l'équipe de développement.