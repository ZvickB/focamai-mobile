import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Eye, EyeOff, LockKeyhole } from "lucide-react-native";

import { Button, HeaderBackButton, ScreenContainer, cx } from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";

function getAuthErrorMessage(error) {
  if (!error) return "";
  return error.message || "Something went wrong. Please try again.";
}

export default function AuthScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;

  const { configured, loading: authLoading, signIn, signInWithGoogle, signUp } = useAuth();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || authLoading;
  const title = mode === "sign-in" ? "Sign in" : "Create account";
  const submitLabel = mode === "sign-in" ? "Sign in" : "Create account";

  async function handleSubmit() {
    setErrorMessage("");
    setStatusMessage("");

    if (!configured) {
      setErrorMessage("Supabase auth is not configured yet.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    let data = null;
    let error = null;

    try {
      const authAction = mode === "sign-in" ? signIn : signUp;
      ({ data, error } = await authAction({ email: trimmedEmail, password }));
    } catch (submitError) {
      error = submitError;
    } finally {
      setSubmitting(false);
    }

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
      return;
    }

    if (mode === "sign-up" && !data?.session) {
      setStatusMessage("Check your email to confirm your account, then come back to sign in.");
      return;
    }

    navigation.goBack();
  }

  async function handleGoogleSignIn() {
    setErrorMessage("");
    setStatusMessage("");

    if (!configured) {
      setErrorMessage("Supabase auth is not configured yet.");
      return;
    }

    setSubmitting(true);
    let error = null;

    try {
      ({ error } = await signInWithGoogle());
    } catch (submitError) {
      error = submitError;
    } finally {
      setSubmitting(false);
    }

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  }

  return (
    <ScreenContainer
      testID="auth.screen"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 18 : 22,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: isCompact ? 24 : 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        {/* Header */}
        <View className="relative min-h-[44px] w-full flex-row items-center justify-between">
          <View className={cx("z-10 flex-row items-center justify-start", isCompact ? "min-w-[72px]" : "min-w-[96px]")}>
            <HeaderBackButton label="Settings" onPress={() => navigation.goBack()} testID="auth.backButton" />
          </View>
          <Text className="absolute inset-x-0 text-center text-base font-semibold text-ink">
            Account
          </Text>
          <View className={isCompact ? "min-w-[72px]" : "min-w-[96px]"} />
        </View>
      </View>

      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        {/* Intro */}
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-cream">
            <LockKeyhole color="#0F6175" size={20} strokeWidth={2} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xl font-semibold text-ink">{title}</Text>
            <Text className="text-[15px] leading-6 text-stone-600">
              Search stays open. Your saved searches can follow you across devices.
            </Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View className="flex-row rounded-full bg-cream p-1">
          {[
            ["sign-in", "Sign in"],
            ["sign-up", "Create account"],
          ].map(([nextMode, label]) => (
            <Pressable
              key={nextMode}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === nextMode }}
              className={cx(
                "h-10 flex-1 items-center justify-center rounded-full",
                mode === nextMode ? "bg-white shadow-sm" : "",
              )}
              onPress={() => {
                setMode(nextMode);
                setErrorMessage("");
                setStatusMessage("");
              }}
            >
              <Text
                className={cx(
                  "text-sm font-semibold",
                  mode === nextMode ? "text-ink" : "text-stone-500",
                )}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-stone-700">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              className="h-12 rounded-[18px] border border-line bg-white px-4 text-base text-ink"
              editable={!isBusy}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#a8a29e"
              testID="auth.emailInput"
              value={email}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-stone-700">Password</Text>
            <View className="relative">
              <TextInput
                autoCapitalize="none"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                className="h-12 rounded-[18px] border border-line bg-white pl-4 pr-12 text-base text-ink"
                editable={!isBusy}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                placeholder="••••••••"
                placeholderTextColor="#a8a29e"
                secureTextEntry={!showPassword}
                testID="auth.passwordInput"
                value={password}
              />
              <Pressable
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityRole="button"
                className="absolute right-1.5 top-1.5 h-9 w-9 items-center justify-center rounded-full"
                onPress={() => setShowPassword((v) => !v)}
              >
                {showPassword
                  ? <EyeOff color="#78716c" size={18} strokeWidth={2} />
                  : <Eye color="#78716c" size={18} strokeWidth={2} />}
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <View className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm leading-6 text-red-700">{errorMessage}</Text>
            </View>
          ) : null}

          {statusMessage ? (
            <View className="rounded-[18px] border border-line bg-cream px-4 py-3">
              <Text className="text-sm leading-6 text-accent">{statusMessage}</Text>
            </View>
          ) : null}

          <Button
            disabled={isBusy}
            onPress={handleSubmit}
            testID="auth.submitButton"
            variant="primary"
          >
            {isBusy ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#ffffff" size="small" />
                <Text className="text-sm font-semibold text-white">{submitLabel}</Text>
              </View>
            ) : (
              submitLabel
            )}
          </Button>
        </View>

        {/* Divider */}
        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-line" />
          <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-400">Or</Text>
          <View className="h-px flex-1 bg-line" />
        </View>

        {/* Google */}
        <Button
          disabled={isBusy}
          onPress={handleGoogleSignIn}
          testID="auth.googleButton"
          variant="secondary"
        >
          Continue with Google
        </Button>
      </View>
    </ScreenContainer>
  );
}
