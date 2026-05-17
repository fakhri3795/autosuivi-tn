# 📱 Guide de Déploiement Google Play Store — AutoSuivi.tn

## Prérequis

### 1. Compte Développeur Google Play
- **Inscription** : [Google Play Console](https://play.google.com/console/signup)
- **Frais** : 25 USD (paiement unique)
- **Identité** : Pièce d'identité tunisienne requise pour la vérification

### 2. Environnement de Build
```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Vérifier le projet
eas build:configure
```

---

## Configuration app.json

### Champs obligatoires pour Google Play
```json
{
  "expo": {
    "name": "AutoSuivi TN",
    "slug": "autosuivi-tn",
    "version": "1.0.0",
    "android": {
      "package": "tn.autosuivi.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#0D1117"
      },
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

### Permissions nécessaires
| Permission | Raison |
|-----------|--------|
| `INTERNET` | Communication avec le backend |
| `ACCESS_NETWORK_STATE` | Vérification de la connexion |

---

## Processus de Build

### Build APK (test interne)
```bash
# APK pour distribution directe
eas build --platform android --profile preview

# L'APK sera disponible au téléchargement une fois le build terminé
```

### Build AAB (Google Play)
```bash
# App Bundle pour Google Play Store
eas build --platform android --profile production
```

### Build local (sans EAS Cloud)
```bash
# Prérequis: Android SDK, Java 17+
eas build --platform android --profile production --local
```

---

## Assets Requis pour Google Play

### Icône de l'application
- **Taille** : 512x512 px
- **Format** : PNG 32-bit avec transparence
- **Emplacement** : `assets/images/icon.png`

### Feature Graphic (bannière)
- **Taille** : 1024x500 px
- **Format** : PNG ou JPEG
- **Usage** : Affichée en haut de la fiche Google Play

### Screenshots (captures d'écran)
Minimum **2 screenshots** par type d'appareil :

| Type | Taille minimale | Taille recommandée |
|------|----------------|-------------------|
| Téléphone | 320x320 px | 1080x1920 px |
| Tablette 7" | 320x320 px | 1080x1920 px |
| Tablette 10" | 320x320 px | 1920x1200 px |

#### Screenshots recommandés pour AutoSuivi.tn :
1. **Tableau de bord** — Vue d'ensemble avec kilométrage et jauges
2. **Liste des véhicules** — Gestion multi-véhicules
3. **Maintenance prédictive** — Score d'urgence et prédictions
4. **Échéances** — Assurance, vignette, visite technique
5. **Historique kilométrage** — Graphique de suivi
6. **Formulaire d'ajout** — Interface intuitive

---

## Fiche Google Play Store

### Informations de base
```
Titre : AutoSuivi TN - Suivi véhicule Tunisie
Description courte : Suivez l'entretien de votre véhicule en Tunisie
Catégorie : Auto et véhicules
```

### Description longue (FR)
```
AutoSuivi TN est l'application indispensable pour les automobilistes tunisiens 🇹🇳

📊 Tableau de bord intelligent
- Suivi du kilométrage en temps réel
- Jauges visuelles pour chaque échéance
- Score d'urgence de maintenance

🔧 Maintenance prédictive
- Algorithme adapté au climat tunisien
- Alertes avant chaque entretien
- Historique complet des interventions

📅 Gestion des échéances
- Assurance véhicule
- Vignette automobile
- Visite technique

🚗 Multi-véhicules
- Gérez toute votre flotte
- Basculez facilement entre les véhicules

💡 Développé en Tunisie, pour la Tunisie
- Intervalles d'entretien adaptés au climat local
- Interface en français
- Fonctionne hors connexion
```

### Classification du contenu
- **Audience** : Tout public
- **Pas de publicités** (version initiale)
- **Pas d'achats intégrés** (version initiale)

---

## Processus de Soumission

### Étape 1 : Créer l'application
1. Google Play Console → **Créer une application**
2. Langue par défaut : **Français**
3. Type : **Application**
4. Gratuit / Payant : **Gratuit**

### Étape 2 : Configuration de la fiche
1. Remplir les informations de base
2. Uploader les assets (icône, screenshots, bannière)
3. Catégorisation : **Auto et véhicules**

### Étape 3 : Politique de confidentialité
- URL requise (héberger sur le VPS ou GitHub Pages)
- Données collectées : email, données véhicule
- Pas de partage avec des tiers

### Étape 4 : Test interne
1. Créer une piste de test interne
2. Uploader l'AAB
3. Ajouter des testeurs (emails)
4. Tester pendant 14 jours minimum

### Étape 5 : Publication
1. Piste de production
2. Uploader l'AAB final
3. Soumettre pour examen (2-7 jours)

---

## Commandes Rapides

```bash
# Vérifier la configuration
eas build:configure

# Build APK de test
eas build --platform android --profile preview

# Build AAB pour production
eas build --platform android --profile production

# Soumettre automatiquement à Google Play
eas submit --platform android --profile production

# Mise à jour OTA (sans rebuild)
eas update --branch production --message "Fix: description du fix"
```

---

## Checklist Pré-soumission

- [ ] Package name unique : `tn.autosuivi.app`
- [ ] Version code incrémenté
- [ ] Icône 512x512 px
- [ ] Feature graphic 1024x500 px
- [ ] Minimum 2 screenshots téléphone
- [ ] Description en français
- [ ] Politique de confidentialité URL
- [ ] Classification du contenu complétée
- [ ] Test sur appareil physique validé
- [ ] Backend accessible (http://102.204.205.49/api)
- [ ] Pas de clés API exposées dans le code
