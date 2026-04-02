// Google Maps Placeholder - AutoSuivi TN
// 
// Pour intégrer Google Maps dans l'application:
//
// 1. Installer le package:
//    yarn expo install react-native-maps
//
// 2. Obtenir une clé API Google Maps:
//    - Allez sur https://console.cloud.google.com/
//    - Créez un projet ou sélectionnez un existant
//    - Activez "Maps SDK for Android" et "Maps SDK for iOS"
//    - Créez une clé API
//
// 3. Configurer dans app.json:
//    {
//      "expo": {
//        "ios": {
//          "config": {
//            "googleMapsApiKey": "YOUR_IOS_API_KEY"
//          }
//        },
//        "android": {
//          "config": {
//            "googleMaps": {
//              "apiKey": "YOUR_ANDROID_API_KEY"
//            }
//          }
//        }
//      }
//    }
//
// 4. Utilisation:
//    import MapView, { Marker } from 'react-native-maps';
//
//    <MapView
//      style={{ flex: 1 }}
//      initialRegion={{
//        latitude: 36.8065,  // Tunis
//        longitude: 10.1815,
//        latitudeDelta: 0.0922,
//        longitudeDelta: 0.0421,
//      }}
//    >
//      <Marker coordinate={{ latitude: 36.8065, longitude: 10.1815 }} />
//    </MapView>
//
// Cas d'utilisation potentiels:
// - Afficher les garages/stations-service à proximité
// - Suivre les trajets du véhicule
// - Localiser les centres de visite technique

export const GOOGLE_MAPS_PLACEHOLDER = true;
