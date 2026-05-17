# 🚀 Guide de Déploiement — AutoSuivi TN

## Architecture

```
┌──────────────────┐     HTTP/REST     ┌──────────────────┐
│  Application APK │ ─────────────▶ │  Backend VPS     │
│  (React Native)  │                  │  102.204.205.49  │
│  Expo / EAS      │ ◀────────────── │  Node.js + MySQL │
└──────────────────┘     JSON          └──────────────────┘
```

- **Frontend** : Application React Native / Expo, compilée en APK autonome.
- **Backend** : Serveur Node.js Express déployé sur VPS `http://102.204.205.49/api`.
- L’APK communique directement avec le backend via HTTP. Pas besoin de déployer le frontend sur le VPS.

---

## Prérequis

- Node.js ≥ 18
- Compte Expo (https://expo.dev)
- EAS CLI installé
- Compte Google Play Developer (pour la publication)

---

## Étapes de Build

### 1. Installer EAS CLI

```bash
npm install -g eas-cli
```

### 2. Se connecter à Expo

```bash
eas login
```

### 3. Build APK (Preview / Test)

Génère un APK installé directement sur un appareil Android :

```bash
eas build --platform android --profile preview
```

> Le profil `preview` est configuré dans `eas.json` pour produire un fichier `.apk`.

### 4. Build AAB (Production — Google Play)

Génère un Android App Bundle pour soumission au Play Store :

```bash
eas build --platform android --profile production
```

### 5. Soumettre au Google Play Store

```bash
eas submit --platform android --profile production
```

> Nécessite une clé de service Google Play configurée. Voir [Expo Submit docs](https://docs.expo.dev/submit/android/).

---

## Configuration

### Variables d’environnement

Le fichier `eas.json` contient déjà la variable `API_BASE_URL` pointée vers le backend :

```json
{
  "build": {
    "production": {
      "env": {
        "API_BASE_URL": "http://102.204.205.49/api"
      }
    }
  }
}
```

> Ne modifiez pas cette URL sauf si le backend est migré.

### Notifications Push

- `expo-notifications` est configuré dans `app.json` avec le plugin.
- Les notifications locales fonctionnent directement après le build.
- Pour les notifications push distantes, configurez Firebase et fournissez `google-services.json`.

---

## Dépannage

| Problème | Solution |
|---|---|
| Build échoue avec erreur de dépendances | `yarn expo install --fix` pour corriger les versions |
| L’APK ne se connecte pas au backend | Vérifier que le VPS est accessible et que le port est ouvert |
| Notifications ne fonctionnent pas | Vérifier les permissions Android et le channel `default` |
| Erreur EAS login | Vérifier les credentials Expo avec `eas whoami` |
| APK trop volumineux | Utiliser le profil `production` (AAB) qui est optimisé par Google Play |
| DatePicker ne s’affiche pas | Vérifier que `react-native-paper-dates` est correctement installé |

---

## Structure des profils EAS

- **development** : Build de développement avec Expo Go
- **preview** : APK installé directement (test interne)
- **production** : AAB pour Google Play Store

---

## Mise à jour OTA (Over-The-Air)

Pour des mises à jour JavaScript sans rebuild :

```bash
eas update --branch production --message "Fix: correction du bug X"
```

> Seules les modifications JS/TS sont mises à jour. Les changements natifs nécessitent un nouveau build.
