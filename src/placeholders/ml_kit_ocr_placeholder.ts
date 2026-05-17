// ML Kit OCR Placeholder - AutoSuivi TN
//
// Pour intégrer la reconnaissance de texte (OCR) pour scanner:
// - Les plaques d'immatriculation
// - Les documents d'assurance
// - Les factures de maintenance
//
// Option 1: Expo Camera + Cloud Vision API
// -----------------------------------------
// 
// 1. Installer expo-camera:
//    yarn expo install expo-camera
//
// 2. Capturer une image:
//    import { Camera } from 'expo-camera';
//    const photo = await camera.takePictureAsync({ base64: true });
//
// 3. Envoyer à Google Cloud Vision API:
//    const response = await fetch(
//      `https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY`,
//      {
//        method: 'POST',
//        body: JSON.stringify({
//          requests: [{
//            image: { content: photo.base64 },
//            features: [{ type: 'TEXT_DETECTION' }]
//          }]
//        })
//      }
//    );
//
// Option 2: react-native-mlkit (nécessite build natif)
// ----------------------------------------------------
//
// 1. Installer:
//    yarn add @react-native-ml-kit/text-recognition
//
// 2. Utilisation:
//    import TextRecognition from '@react-native-ml-kit/text-recognition';
//    const result = await TextRecognition.recognize(imageUri);
//    console.log(result.text);
//
// Option 3: Tesseract.js (pour le web)
// ------------------------------------
//
// import Tesseract from 'tesseract.js';
// const result = await Tesseract.recognize(imageUrl, 'fra');
// console.log(result.data.text);
//
// Regex pour plaques tunisiennes:
// const tunisianPlateRegex = /\d{1,3}\s*T[NU]\s*\d{1,4}/i;
// 
// Exemple de parsing:
// const extractPlate = (text: string): string | null => {
//   const match = text.match(tunisianPlateRegex);
//   return match ? match[0].replace(/\s+/g, ' ').toUpperCase() : null;
// };

export const ML_KIT_OCR_PLACEHOLDER = true;
