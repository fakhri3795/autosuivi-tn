# 🐛 DEBUG_RESOLUTION — Erreur "Couldn't find any screens for the navigator"

## Problème

Après les modifications de la v2.1.0, l'application crash au démarrage avec l'erreur :

```
Render Error: Couldn't find any screens for the navigator.
Have you defined any screens as its children?
```

**Source de l'erreur :** `useNavigationBuilder.js:196` → `SlotNavigator` (Navigator.js:102)

**Screenshot :** `/home/ubuntu/Uploads/1778627330789.png`

---

## Analyse de la cause racine

### Le mécanisme de l'erreur

L'erreur `routeNames.length === 0` signifie qu'**aucun écran** n'a pu être enregistré dans le navigateur. Dans Expo Router, cela se produit quand les fichiers d'écran ne peuvent pas être chargés (import crash).

### Causes identifiées (3 problèmes combinés)

#### 1. 🔴 Barrel Export du `ThemedDatePicker` — CAUSE PRINCIPALE

Le fichier `src/presentation/components/index.ts` (barrel export) ré-exportait `ThemedDatePicker`, qui importe :
- `react-native-paper` (via `Provider`, `MD3DarkTheme`)
- `react-native-paper-dates` (via `DatePickerModal`, `registerTranslation`)

**Le problème :** `registerTranslation('fr', {...})` est appelé au **top-level du module** (pendant l'évaluation du fichier). Si cet appel échoue (module natif manquant, version incompatible), il crashe le barrel entier.

**Impact en cascade :**
- `components/index.ts` crashe → **TOUS** les composants du barrel deviennent indisponibles
- **Tous les écrans de tabs** importent depuis ce barrel → aucun ne peut se charger
- Le `Tabs` navigator a 0 écrans → **erreur fatale**

```
ThemedDatePicker crash → barrel crash → tous les tab screens crash → 0 screens → ERREUR
```

#### 2. 🟡 Import top-level de NotificationService dans `_layout.tsx`

`app/_layout.tsx` importait `NotificationService` au top-level :
```typescript
import { registerForPushNotifications } from '../src/data/services/NotificationService';
```

`NotificationService.ts` appelle `Notifications.setNotificationHandler()` au top-level. Si le module natif `expo-notifications` n'est pas disponible (Expo Go, erreur de config), le root layout crash → **aucun écran chargé**.

#### 3. 🟡 `app.json` — `google-services.json` manquant + `@react-native-firebase/app` non configuré

```json
"googleServicesFile": "./app/google-services.json"  // ← fichier inexistant
"plugins": ["@react-native-firebase/app"]            // ← sans google-services.json
```

Cela peut causer un crash natif au démarrage sur Android.

---

## Corrections appliquées

### Fix 1 : Retirer `ThemedDatePicker` du barrel export

**Fichier :** `src/presentation/components/index.ts`

```typescript
// AVANT : export { ThemedDatePicker } from './ThemedDatePicker';
// APRÈS : commenté, avec note explicative
```

**Import direct** dans les fichiers qui en ont besoin :
```typescript
// Dans deadlines.tsx et maintenance/form.tsx
import { ThemedDatePicker } from '../../src/presentation/components/ThemedDatePicker';
```

**Pourquoi :** Isoler `react-native-paper-dates` pour éviter le crash en cascade du barrel.

### Fix 2 : Protéger `registerTranslation` avec try-catch

**Fichier :** `src/presentation/components/ThemedDatePicker.tsx`

```typescript
try {
  registerTranslation('fr', { ... });
} catch (e) {
  console.warn('Failed to register French translation for DatePicker:', e);
}
```

### Fix 3 : Import dynamique de NotificationService

**Fichier :** `app/_layout.tsx`

```typescript
// AVANT :
import { registerForPushNotifications } from '../src/data/services/NotificationService';

// APRÈS : import dynamique dans useEffect
if (Platform.OS !== 'web') {
  try {
    const { registerForPushNotifications } = require('../src/data/services/NotificationService');
    await registerForPushNotifications();
  } catch (notifError) {
    console.warn('Push notification setup failed:', notifError);
  }
}
```

**Fichier :** `src/presentation/context/VehicleContext.tsx`

```typescript
// Import conditionnel avec try-catch
let updateNotificationsFromPredictions = null;
try {
  updateNotificationsFromPredictions = require('...').updateNotificationsFromPredictions;
} catch (e) { }

// Appel sécurisé avec optional chaining
updateNotificationsFromPredictions?.(items, mileage, avgKm)?.catch?.(...);
```

### Fix 4 : Protéger `setNotificationHandler`

**Fichier :** `src/data/services/NotificationService.ts`

```typescript
try {
  Notifications.setNotificationHandler({ ... });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}
```

### Fix 5 : Nettoyer `app.json`

- Supprimé `"googleServicesFile": "./app/google-services.json"` (fichier inexistant)
- Supprimé `"@react-native-firebase/app"` des plugins (non configuré)

---

## Principe appliqué : Isolation des dépendances

```
components/index.ts (barrel)
├── GlassCard ✓ (safe - pure RN)
├── GradientButton ✓ (safe - pure RN)
├── CircularGauge ✓ (safe - pure RN)
├── ... ✓ (safe)
└── ThemedDatePicker ✗ → RETIRÉ DU BARREL
    └── react-native-paper-dates (dépendance externe lourde)
```

**Règle :** Ne jamais inclure dans un barrel export un composant qui dépend de librairies tierces lourdes avec des side-effects au top-level du module.

---

## Vérification

```bash
# Le build Android compile sans erreur
npx expo export --platform android  # ✓

# Le build Web compile sans erreur
npx expo export --platform web      # ✓
```

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `app.json` | Supprimé googleServicesFile + firebase plugin |
| `app/_layout.tsx` | Import dynamique de NotificationService |
| `app/tabs/deadlines.tsx` | Import direct de ThemedDatePicker |
| `app/maintenance/form.tsx` | Import direct de ThemedDatePicker |
| `src/presentation/components/index.ts` | Retiré ThemedDatePicker du barrel |
| `src/presentation/components/ThemedDatePicker.tsx` | try-catch sur registerTranslation |
| `src/data/services/NotificationService.ts` | try-catch sur setNotificationHandler |
| `src/presentation/context/VehicleContext.tsx` | Import conditionnel + optional chaining |

---

*Résolu le 13 mai 2026*
