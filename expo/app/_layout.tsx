import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { CyclesProvider } from "@/providers/CyclesProvider";
import { FeedProvider } from "@/providers/FeedProvider";
import { ChallengesProvider } from "@/providers/ChallengesProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { CardProvider } from "@/providers/CardProvider";
import { SecurityProvider } from "@/providers/SecurityProvider";
import SplashIntro from "@/components/SplashIntro";

void SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('[Layout] SplashScreen.preventAutoHideAsync failed');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isReady } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isReady || showSplash) return;

    const currentSegment = segments[0];
    const isOnAuthScreen =
      currentSegment === "welcome" ||
      currentSegment === "login" ||
      currentSegment === "signup";

    if (isAuthenticated && isOnAuthScreen) {
      console.log("[Nav] Authenticated, redirecting to home");
      router.replace("/(tabs)/(home)");
      hasNavigated.current = true;
    } else if (!isAuthenticated && !isOnAuthScreen) {
      console.log("[Nav] Not authenticated, redirecting to welcome");
      router.replace("/welcome");
      hasNavigated.current = true;
    }
  }, [isAuthenticated, isReady, segments, router, showSplash]);

  const handleSplashFinish = useCallback(() => {
    console.log("[Layout] Splash finished");
    setShowSplash(false);
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="create-cycle" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="cycle" options={{ headerShown: false }} />
        <Stack.Screen name="parent-approval" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
        <Stack.Screen name="card-customize" options={{ headerShown: false }} />
        <Stack.Screen name="security-setup" options={{ headerShown: false }} />
        <Stack.Screen name="ai-assistant" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="challenges" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="challenge-dashboard" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="card-experience" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="spending-categories" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="round-ups" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      {showSplash && <SplashIntro onFinish={handleSplashFinish} />}
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <CyclesProvider>
              <FeedProvider>
                <ChallengesProvider>
                  <CardProvider>
                    <SecurityProvider>
                      <RootLayoutNav />
                    </SecurityProvider>
                  </CardProvider>
                </ChallengesProvider>
              </FeedProvider>
            </CyclesProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
