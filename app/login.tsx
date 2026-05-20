
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 768;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Iltimos, email va parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        console.log('Supabase signIn response:', { data, signInError });
        if (signInError) {
          // Show a user‑friendly message while keeping the original error for debugging
          const friendly = signInError.message === 'Invalid login credentials'
            ? "Email yoki parol noto'g'ri"
            : signInError.message;
          console.error('Login error:', signInError);
          setError(friendly);
          setLoading(false);
          return;
        }
        // Ensure a session exists
        if (!data.session) {
          console.warn('No session returned after sign‑in');
          setError('Kirish muvaffaqiyatsiz, sessiya topilmadi');
          setLoading(false);
          return;
        }
        // Persist for web if needed
        if (Platform.OS === 'web') {
          localStorage.setItem('isRegistered', 'true');
        }
        // Navigate to the main tabs screen
        router.replace('/(tabs)');
        return;
      } catch (err) {
        console.error('Unexpected login exception:', err);
        setError('Kutilmagan xatolik yuz berdi');
        setLoading(false);
        return;
      }

      // Save to localStorage for compatibility with existing logic
      if (Platform.OS === 'web') {
        localStorage.setItem('isRegistered', 'true');
        // Fetch profile if needed, but for now we'll just go to tabs
      }

      router.replace('/(tabs)');
    } catch (err) {
      setError('Kutilmagan xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.logoTitle}>Oson Kassa</Text>
        </View>

        <Text style={styles.title}>Kirish</Text>
        <Text style={styles.subtitle}>Tizimga kirish uchun ma'lumotlaringizni kiriting</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parol</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Parolingizni kiriting"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Yuklanmoqda...' : 'Kirish'}</Text>
          {!loading && <Ionicons name="log-in-outline" size={20} color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>{"Akkauntingiz yo'qmi? Ro'yxatdan o'tish"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: IS_DESKTOP ? 450 : '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  logoBadge: {
    width: 44,
    height: 44,
    backgroundColor: '#E31E24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E31E24',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1A1A1A',
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  button: {
    backgroundColor: '#E31E24',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E31E24',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
