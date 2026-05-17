# 📝 Changelog — AutoSuivi.tn

Toutes les modifications notables de ce projet sont documentées ici.

## [2.1.3] - 2026-05-13

### 🐛 Corrections critiques — Backend

- **Fix : Route GET /api/vehicles** — L'endpoint retournait 404 car la route exigeait `:userId` dans l'URL. Remplacé par `GET /` qui extrait le `userId` du token JWT.
- **Fix : Auth middleware sur toutes les routes** — Ajout de `authenticateToken` middleware sur les routes vehicles, maintenance, deadlines et predictions. Avant, `req.user` n'était jamais populé.
- **Fix : Schema Joi véhicule** — Le champ `id` était supprimé par `stripUnknown: true`. Ajouté `id: Joi.string().optional()` dans le `vehicleSchema` pour accepter les UUID client.
- **Fix : Génération UUID serveur** — Le contrôleur `addVehicle` génère maintenant un UUID côté serveur si le client n'en fournit pas.

### 🎨 Améliorations UX — Frontend

- **Messages d'erreur français** — Remplacement des messages techniques (`ApiError: Endpoint non trouvé`) par des messages clairs en français dans `VehicleContext.tsx`.
- **Retry automatique** — Ajout d'une logique de retry (2 tentatives, délai progressif) pour les erreurs réseau et serveur (5xx).
- **Messages contextuels** — Différenciation des messages selon le type d'erreur (401 → session expirée, 404 → service indisponible, 5xx → problème serveur, réseau → vérifier connexion).

### 📝 Notes techniques

- Fichiers backend modifiés et déployés sur le VPS :
  - `src/routes/vehicleRoutes.js` — Nouvelle route `GET /` + auth middleware
  - `src/routes/maintenanceRoutes.js` — Auth middleware ajouté
  - `src/routes/deadlineRoutes.js` — Auth middleware ajouté
  - `src/routes/predictionRoutes.js` — Auth middleware ajouté
  - `src/controllers/vehicleController.js` — Logique améliorée avec fallback UUID
  - `src/middleware/validate.js` — `id` ajouté au vehicleSchema

---

## [2.1.2] - 2026-05-13

### 🐛 Corrections critiques
- **Fix ajout de voiture** — Le backend attend un `id` dans le corps de la requête POST /vehicles. Le frontend ne l'envoyait pas, causant `Column 'id' cannot be null`. Correction : génération UUID côté client dans `VehicleRemoteDataSource.create()`.
- **Fix reset-password** — Le champ `newPassword` était converti en `new_password` par l'intercepteur Axios, causant un rejet 400 par le backend. Les endpoints auth sont désormais exclus de la conversion camelCase→snake_case.
- **Fix "error network"** — Les erreurs réseau Axios (timeout, Network Error, ECONNREFUSED) affichaient des messages techniques en anglais. Remplacement par des messages clairs en français.
- **Timeout augmenté** — Passage de 15s à 20s pour les connexions mobiles lentes en Tunisie.

### ✨ Nouvelles fonctionnalités
- **Suppression de voiture** — Nouveau bouton poubelle (🗑️) sur chaque carte véhicule avec :
  - Modale de confirmation « Êtes-vous sûr de vouloir supprimer ? » + avertissement irréversible
  - Suppression en cascade côté backend (entretiens, échéances, relevés kilométriques)
  - Message de succès « Voiture supprimée avec succès »
  - Rafraîchissement automatique de la liste après suppression
- **Composant ConfirmDialog** — Nouvelle modale réutilisable avec deux boutons (Annuler/Confirmer), icône, couleurs personnalisables

### ✨ Améliorations UX
- **Messages d'erreur 100% français** — Tous les messages d'erreur sont maintenant en français clair et compréhensible :
  - `"Impossible de se connecter au serveur. Vérifiez votre connexion Internet."` (réseau)
  - `"La connexion est trop lente. Vérifiez votre connexion Internet et réessayez."` (timeout)
  - `"Email ou mot de passe incorrect. Vérifiez vos identifiants."` (auth 401)
  - `"Cette adresse email est déjà utilisée. Essayez de vous connecter."` (doublon 409)
  - `"Le serveur rencontre un problème. Réessayez dans quelques instants."` (500/502/503)
  - `"Trop de tentatives. Veuillez patienter quelques minutes."` (429 rate limit)
  - `"Votre mot de passe a été réinitialisé avec succès !"` (reset OK)
- **Validation améliorée** — Validation email côté client dans le formulaire de reset-password
- **Suppression des Alert.alert génériques** — Les erreurs auth passent maintenant par le banner contextuel
- **VehicleCard améliorée** — Ligne d'actions (édition + suppression) sous chaque carte véhicule

### 🔧 Technique
- Génération UUID dans `VehicleRemoteDataSource.create()` pour compatibilité backend
- Nouveau composant `ConfirmDialog.tsx` avec gestion loading, icône, couleurs
- Ajout de `SKIP_KEY_CONVERSION_PATHS` dans ApiClient pour exclure les endpoints auth de la conversion de clés
- Fonctions `getErrorMessageByStatus()` et `getNetworkErrorMessage()` centralisées dans ApiClient
- Gestion d'erreur améliorée dans `VehicleContext` (addVehicle, deleteVehicle)
- Version : 2.1.2 / versionCode : 4

## [2.1.1] - 2026-05-13

### 🐛 Corrections
- **Authentification réparée** - Login/Signup fonctionnent correctement avec le backend VPS
- **Mot de passe oublié** - Nouvelle fonctionnalité de réinitialisation par email
- **Messages d'erreur améliorés** - Feedback utilisateur plus clair en français
- **Encodage français corrigé** - Tous les accents (é, è, ê, à) s'affichent correctement
- **Backend synchronisé** - Base de données MariaDB restaurée et endpoints mis à jour

### 📦 Build
- APK Preview: `eas build --platform android --profile preview`
- Build ID: `c2b1402f-1cc0-460a-b05d-d8ab684d3c0d`
- Lien APK: https://expo.dev/artifacts/eas/q3pqzaNUqWr7A4P8DhuzXT.apk
- SDK: Expo 54.0.0
- Expiration: 2026-08-11

---

## [2.1.0] — 2026-05-10

### ✨ Améliorations

#### 1. Affichage des prédictions de maintenance amélioré
- **Dates complètes** : Passage de `month: 'short'` à `month: 'long'` sur toutes les vues (Dashboard, Maintenance, Kilométrage, Historique) pour afficher les noms de mois complets (ex: "5 Juillet 2026" au lieu de "5 juil.")
- **Texte de prédiction clair** : Le texte des éléments à venir affiche maintenant "Prochain : X km • date" au lieu de "~X km • date"
- **Dashboard** : La carte de maintenance affiche le km cible exact ("Prochain à X km • ~Y km restants")
- **PredictionItem** : Nouvel attribut `lastMaintenanceKm` pour suivre le dernier km de maintenance

#### 2. DatePicker thématique personnalisé
- **Nouveau composant `ThemedDatePicker`** : Modal calendrier utilisant `react-native-paper-dates` avec thème sombre et accent orange
- **Remplacement du DateTimePicker système** : Les écrans Échéances et Formulaire Maintenance utilisent maintenant le ThemedDatePicker pour une expérience cohérente sur toutes les plateformes (Android, iOS, Web)
- **Locale française** : Calendrier entièrement traduit en français

#### 3. Carte kilométrage cliquable
- **Dashboard** : La carte de kilométrage est maintenant cliquable (ouvre le modal de mise à jour)
- **Indicateur visuel** : Icône crayon + texte "Appuyez pour mettre à jour" ajouté sous le kilométrage

#### 4. Service de Notifications
- **`NotificationService`** : Nouveau service avec gestion complète des notifications locales :
  - Enregistrement des permissions push
  - Planification de rappels de maintenance (7 jours avant)
  - Planification de rappels kilométriques (500 km avant)
  - Annulation de toutes les notifications
  - Mise à jour automatique depuis les prédictions
- **Intégration `_layout.tsx`** : Enregistrement push notifications au démarrage + listener de réponse
- **Intégration `VehicleContext`** : Planification automatique des notifications lors du recalcul des prédictions
- **`DEPLOYMENT_GUIDE.md`** : Guide de déploiement complet avec architecture, étapes EAS Build, et dépannage

---

## [2.0.0] — 2026-05-08

### ✨ Nouvelles Fonctionnalités

#### Frontend
- **Maintenance CRUD via API** : Les enregistrements de maintenance passent maintenant par le backend au lieu d’AsyncStorage
- **Deadlines CRUD via API** : Les échéances sont synchronisées avec le backend MariaDB
- **PredictionService** : Service hybride qui appelle le backend `/api/predictions` avec fallback local
- **Alertes de prédiction** : Badges d’alerte sur le dashboard (urgence, temps dépassé, km critiques)
- **deleteMaintenanceRecord** : Nouvelle fonction pour supprimer un enregistrement de maintenance
- **IMaintenanceRepository** : Interface domain-layer pour les opérations de maintenance
- **IDeadlineRepository** : Interface domain-layer pour les opérations d’échéances
- **MaintenanceRemoteDataSource** : Source de données distante pour les entretiens
- **DeadlineRemoteDataSource** : Source de données distante pour les échéances
- **MaintenanceRepositoryImpl** : Implémentation concrète du repository maintenance
- **DeadlineRepositoryImpl** : Implémentation concrète du repository deadlines

#### Backend
- **Endpoint Prédictions** : `GET /api/predictions/:vehicleId` — Calcul serveur des prédictions de maintenance
- **Validation Joi** : Tous les endpoints POST/PUT validés avec messages d’erreur en français
- **Helmet** : Headers HTTP sécurisés (CSP, HSTS, X-Frame-Options, etc.)
- **Rate Limiting** : 200 req/15min général, 20 req/15min pour l’authentification
- **Winston Logger** : Logs structurés JSON dans `error.log` et `combined.log`
- **Morgan** : Logs HTTP de toutes les requêtes
- **DELETE endpoints** : Ajout de DELETE sur maintenance et deadlines
- **UPDATE endpoints** : Ajout de PUT sur maintenance
- **Pagination** : Endpoint maintenance avec pagination (`?page=1&limit=50`)
- **Cascade delete** : Suppression d’un véhicule supprime aussi maintenance, deadlines, mileage
- **Index SQL** : Optimisation des requêtes avec index sur vehicles, maintenance, deadlines

### 🔧 Corrections
- **DB Password** : Correction du mot de passe MariaDB dans `.env` (guillemets en trop)
- **VehicleContext refactorisé** : Suppression de la dépendance AsyncStorage pour maintenance/deadlines
- **Error handling unifié** : Messages d’erreur cohérents en français sur tous les endpoints

### 📦 Déploiement
- **eas.json** : Configuration EAS Build (development, preview, production)
- **deploy.sh** : Script de déploiement backend automatisé
- **GOOGLE_PLAY_DEPLOYMENT.md** : Guide complet pour la soumission Google Play Store
- **COMPLETE_IMPLEMENTATION_GUIDE.md** : Documentation technique complète

### 🏗️ Architecture
- Migration complète vers Clean Architecture pour tous les domaines :
  - `domain/repositories/` → Interfaces (contrats)
  - `data/datasources/remote/` → Sources HTTP
  - `data/repositories/` → Implémentations concrètes
  - `presentation/context/` → State management

---

## [1.0.0] — 2026-05-07

### Fonctionnalités initiales
- Authentification JWT (register/login)
- CRUD Véhicules (backend)
- Suivi Kilométrage (backend)
- Maintenance (AsyncStorage local)
- Échéances (AsyncStorage local)
- Algorithme de prédiction local (KmCalculator)
- Interface React Native avec thème sombre
- Navigation par onglets (Expo Router)
