import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProgressProvider } from '@/lib/progress';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null; // splash-equivalent; avoids a flash of sign-in
  if (!session && pathname !== '/sign-in') {
    return <Redirect href="/sign-in" />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ProgressProvider>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="topic/[id]" options={{ title: '' }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
