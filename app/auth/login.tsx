import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { InputField, GradientButton, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
        title: '',
        message: '',
        type: 'success',
      });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email?.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!password?.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/tabs');
      } else {
         setAlertConfig({
        title: 'error',
        message:'Email ou mot de passe incorrect',
        type: 'error',
      });
      setAlertVisible(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
        setAlertConfig({
        title: 'error',
        message:'Une erreur est survenue',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertConfig.type === 'success') {
      router.back();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>AutoSuivi TN</Text>
            <Text style={styles.subtitle}>Gestion de maintenance véhicule</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            
            <InputField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              isPassword
              error={errors.password}
            />

            <GradientButton
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
            
            <CustomAlert
                    visible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={handleAlertClose}
                  />

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Pas de compte ? </Text>
              <Link href="/auth/signup">
                <Text style={styles.link}>S'inscrire</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: Spacing.md,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
