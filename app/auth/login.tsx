import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { InputField, GradientButton } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';
import apiClient from '../../src/core/network/ApiClient';

export default function LoginScreen() {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Mot de passe oublié
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

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
      }
      // authError from context will display the backend error
    } catch (error) {
      // Error already handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail?.trim()) {
      setResetMessage('\u274c Veuillez saisir votre adresse email.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetMessage('\u274c Adresse email invalide.');
      return;
    }
    if (!newPassword?.trim()) {
      setResetMessage('\u274c Veuillez saisir un nouveau mot de passe.');
      return;
    }
    if (newPassword.length < 6) {
      setResetMessage('\u274c Le mot de passe doit contenir au moins 6 caract\u00e8res.');
      return;
    }
    
    setResetLoading(true);
    setResetMessage('');
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email: resetEmail,
        newPassword: newPassword,
      });
      setResetMessage('\u2705 Votre mot de passe a \u00e9t\u00e9 r\u00e9initialis\u00e9 avec succ\u00e8s !');
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setNewPassword('');
        setResetMessage('');
      }, 2500);
    } catch (error: any) {
      // ApiError already has a user-friendly French message from ApiClient
      const msg = error?.message || 'Impossible de r\u00e9initialiser le mot de passe. R\u00e9essayez.';
      setResetMessage('\u274c ' + msg);
    } finally {
      setResetLoading(false);
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

          {/* Afficher l'erreur du backend */}
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

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

            <TouchableOpacity 
              onPress={() => {
                setResetEmail(email);
                setShowResetModal(true);
              }}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <GradientButton
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
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

      {/* Modal Mot de passe oublié */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
            
            <InputField
              label="Email du compte"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <InputField
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              isPassword
            />

            {resetMessage ? (
              <Text style={[
                styles.resetMessage,
                { color: resetMessage.startsWith('✅') ? Colors.success : Colors.danger }
              ]}>
                {resetMessage}
              </Text>
            ) : null}

            <GradientButton
              title="Réinitialiser"
              onPress={handleResetPassword}
              loading={resetLoading}
              style={styles.button}
            />

            <TouchableOpacity 
              onPress={() => {
                setShowResetModal(false);
                setResetMessage('');
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resetMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
