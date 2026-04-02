# Firebase Setup Instructions - AutoSuivi TN

## Étape 1: Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet "AutoSuivi-TN"
4. Suivez les étapes de configuration

## Étape 2: Configurer Firebase Authentication

1. Dans la console Firebase, allez dans "Authentication"
2. Cliquez sur "Commencer"
3. Activez "Email/Mot de passe" comme méthode de connexion

## Étape 3: Configurer Firestore

1. Dans la console Firebase, allez dans "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Sélectionnez le mode de démarrage (production ou test)
4. Choisissez un emplacement (europe-west1 recommandé pour la Tunisie)

## Étape 4: Ajouter Firebase à l'app

```bash
yarn expo install firebase
```

## Étape 5: Configurer Firebase dans l'app

Créez un fichier `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## Étape 6: Remplacer MockDataSource

Remplacez les appels à MockDataSource par des appels Firestore:

```typescript
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Exemple: Récupérer les véhicules
export const getVehicles = async (userId: string) => {
  const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## Structure Firestore recommandée

```
users/{userId}
  - email: string
  - name: string
  - createdAt: timestamp

vehicles/{vehicleId}
  - userId: string
  - brand: string
  - model: string
  - year: number
  - plate: string
  - initialMileage: number
  - currentMileage: number
  - isActive: boolean
  - createdAt: timestamp

mileageReadings/{readingId}
  - vehicleId: string
  - value: number
  - date: timestamp
  - delta: number | null

maintenanceRecords/{recordId}
  - vehicleId: string
  - type: string
  - date: timestamp
  - mileage: number
  - cost: number | null
  - notes: string | null

deadlines/{deadlineId}
  - vehicleId: string
  - type: string
  - expiryDate: timestamp
```

## Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
    
    // Similar rules for other collections...
  }
}
```
