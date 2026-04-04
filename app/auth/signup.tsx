import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { InputField, GradientButton, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';

export default function SignupScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
      title: '',
      message: '',
      type: 'success',
    });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name?.trim()) {
      newErrors.name = 'Nom requis';
    }
    
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
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: '', color: Colors.textMuted };
    if (password.length < 6) return { level: 1, text: 'Faible', color: Colors.danger };
    if (password.length < 10) return { level: 2, text: 'Moyen', color: Colors.warning };
    return { level: 3, text: 'Fort', color: Colors.success };
  };

  const strength = getPasswordStrength();

  const handleSignup = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const success = await signup(name, email, password);
      if (success) {
        router.replace('/tabs');
      } else {
        setAlertConfig({
        title: 'Succès',
        message: 'Inscription échouée',
        type: 'success',
      });
      setAlertVisible(true);
      }
    } catch (error) {
      setAlertConfig({
        title: 'Erreur',
        message: 'Une erreur est survenue',
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
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez AutoSuivi TN</Text>

          <View style={styles.form}>
            <InputField
              label="Nom complet"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />
            
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
            
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: level <= strength.level ? strength.color : Colors.surfaceLight },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  {strength.text}
                </Text>
              </View>
            )}
            
            <InputField
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              error={errors.confirmPassword}
            />

            <GradientButton
              title="S'inscrire"
              onPress={handleSignup}
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
              <Text style={styles.linkText}>Déjà un compte ? </Text>
              <Link href="/auth/login">
                <Text style={styles.link}>Se connecter</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  form: {
    width: '100%',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginLeft: Spacing.sm,
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
