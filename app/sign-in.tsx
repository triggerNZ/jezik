import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function SignInScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  if (session) return <Redirect href="/" />;

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    setError(null);
    try {
      await signIn(trimmed);
      setStatus('sent');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <ThemedView style={styles.root}>
      <View style={styles.card}>
        <ThemedText type="title">Sign in to jezik</ThemedText>
        <ThemedText style={styles.subtitle}>
          We&rsquo;ll email you a magic link. No password needed.
        </ThemedText>

        {status === 'sent' ? (
          <View style={styles.sent}>
            <ThemedText type="defaultSemiBold">Check your email.</ThemedText>
            <ThemedText style={styles.subtitle}>
              Tap the link from {email.trim()} to finish signing in.
            </ThemedText>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={status !== 'sending'}
            />
            <Pressable
              onPress={submit}
              disabled={status === 'sending' || email.trim().length === 0}
              style={[
                styles.submit,
                (status === 'sending' || email.trim().length === 0) && styles.submitDisabled,
              ]}>
              <ThemedText style={styles.submitText}>
                {status === 'sending' ? 'Sending…' : 'Send magic link'}
              </ThemedText>
            </Pressable>
            {status === 'error' && error && (
              <ThemedText style={styles.error}>{error}</ThemedText>
            )}
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    maxWidth: 420,
    width: '100%',
    gap: 16,
  },
  subtitle: { opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0b1020',
    backgroundColor: '#fff',
  },
  submit: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '600' },
  sent: { gap: 8 },
  error: { color: '#b91c1c', fontSize: 13 },
});
