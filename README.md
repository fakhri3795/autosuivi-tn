# 🚗 AutoSuivi.tn — Suivi Intelligent de Véhicule pour la Tunisie

[![React Native](https://img.shields.io/badge/React_Native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933)](https://nodejs.org/)

Application mobile de suivi et maintenance préventive des véhicules, spécialement conçue pour les automobilistes tunisiens 🇹🇳.

---

## ✨ Fonctionnalités

### 📊 Tableau de bord
- Kilométrage en temps réel avec tendances
- Jauges visuelles des échéances (assurance, vignette, visite technique)
- Score d'urgence maintenance avec alertes intelligentes

### 🔧 Maintenance Prédictive
- Algorithme de prédiction basé sur km + temps + type de conduite
- Intervalles adaptés au climat tunisien (chaleur, poussière)
- Historique complet des interventions
- 7 types de maintenance suivis

### 📅 Gestion des Échéances
- Assurance véhicule
- Vignette automobile
- Visite technique
- Alertes 60 jours avant expiration

### 🚗 Multi-véhicules
- Ajout illimité de véhicules
- Basculement rapide entre véhicules
- Données indépendantes par véhicule

---

## 🏗️ Architecture

### Frontend — Clean Architecture
```
Domain Layer   → Entités + Interfaces Repository
Data Layer     → Remote DataSources + Repository Impls + Services
Presentation   → Context (State) + Components + Screens
```

### Backend — Node.js / Express
```
Routes → Validation (Joi) → Controllers → MariaDB
                          ↓
                   Winston Logs + Helmet Security
```

### Stack Technique
| Composant | Technologie |
|-----------|------------|
| Mobile | React Native + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router (file-based) |
| Backend | Node.js + Express |
| Base de données | MariaDB |
| Auth | JWT (24h) |
| Proxy | Nginx |
| Process Manager | PM2 |

---

## 🚀 Démarrage Rapide

### Frontend
```bash
# Installer les dépendances
yarn install

# Lancer en mode développement
yarn start

# Lancer sur Android
yarn android

# Lancer sur iOS
yarn ios
```

### Backend
```bash
cd autosuivi-api

# Installer
npm install

# Configurer .env
cp .env.example .env
# Éditer DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET

# Lancer
npm start
# ou avec PM2
pm2 start index.js --name autosuivi-api
```

---

## 📖 Documentation

| Document | Description |
|----------|------------|
| [COMPLETE_IMPLEMENTATION_GUIDE.md](./COMPLETE_IMPLEMENTATION_GUIDE.md) | Architecture, endpoints, tests |
| [GOOGLE_PLAY_DEPLOYMENT.md](./GOOGLE_PLAY_DEPLOYMENT.md) | Guide Google Play Store |
| [CHANGELOG.md](./CHANGELOG.md) | Historique des modifications |

---

## 🔒 Sécurité

- **Helmet** : Headers HTTP sécurisés
- **Rate Limiting** : Protection DDoS (200 req/15min)
- **JWT** : Authentification stateless
- **Joi** : Validation des données entrantes
- **bcrypt** : Hash des mots de passe

---

## 📱 Build & Déploiement

```bash
# APK de test
eas build --platform android --profile preview

# AAB pour Google Play
eas build --platform android --profile production

# Mise à jour OTA
eas update --branch production --message "description"
```

---

## 🤝 Contributeurs

Développé avec ❤️ en Tunisie.

---

## 📄 Licence

Propriétaire — AutoSuivi.tn © 2026
