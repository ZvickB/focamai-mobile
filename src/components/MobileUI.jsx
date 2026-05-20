import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { ChevronLeft } from "lucide-react-native";

const wordmarkImage = require("../../assets/wordmark.png");

export function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function ScreenContainer({
  children,
  contentContainerStyle,
  footer,
  keyboardShouldPersistTaps,
  safeAreaEdges = ["bottom"],
  testID,
}) {
  return (
    <SafeAreaView edges={safeAreaEdges} className="flex-1 bg-mist" testID={testID}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { gap: 20, paddingHorizontal: 24, paddingVertical: 24 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </ScrollView>
      {footer ? <View className="border-t border-line bg-cream px-6 py-3">{footer}</View> : null}
    </SafeAreaView>
  );
}

export function ScreenIntro({ eyebrow, title, description, testID }) {
  return (
    <View className="gap-3">
      {eyebrow ? (
        <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-accent">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-[30px] font-semibold leading-[38px] text-ink" testID={testID}>
        {title}
      </Text>
      {description ? (
        <Text className="text-base leading-7 text-stone-600">{description}</Text>
      ) : null}
    </View>
  );
}

export function BrandWordmark({ className = "", imageClassName = "h-12 w-52" }) {
  return (
    <View className={cx("items-start", className)}>
      <Image
        accessibilityLabel="Focamai"
        className={imageClassName}
        resizeMode="contain"
        source={wordmarkImage}
      />
    </View>
  );
}

export function IconButton({
  accessibilityLabel,
  children,
  className = "",
  onPress,
  testID,
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={cx("h-11 w-11 items-center justify-center rounded-full", className)}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export function HeaderBackButton({ label, onPress, testID }) {
  return (
    <Pressable
      accessibilityLabel={`Back to ${label.toLowerCase()}`}
      accessibilityRole="button"
      className="min-h-[44px] flex-row items-center gap-1 rounded-full pr-3"
      onPress={onPress}
      testID={testID}
    >
      <ChevronLeft color="#14222b" size={24} strokeWidth={2.3} />
      <Text className="text-base font-semibold text-ink">{label}</Text>
    </Pressable>
  );
}

export function AppHeader({
  left,
  right,
  wordmarkClassName = "h-9 w-36",
}) {
  return (
    <View className="relative min-h-[44px] w-full flex-row items-center justify-between">
      <View className="z-10 min-w-[96px] flex-row items-center justify-start">{left}</View>
      <BrandWordmark
        className="absolute inset-x-0 items-center"
        imageClassName={wordmarkClassName}
      />
      <View className="z-10 min-w-[96px] flex-row items-center justify-end gap-2">{right}</View>
    </View>
  );
}

export function Surface({ children, className = "", variant = "default", ...props }) {
  const variantClassName =
    variant === "quiet"
      ? "border-line bg-cream"
      : variant === "accent"
        ? "border-secondary bg-white"
        : "border-line bg-white";

  return (
    <View
      className={cx(
        "rounded-[20px] border px-5 py-5 shadow-sm",
        variantClassName,
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ eyebrow, title, description }) {
  return (
    <View className="gap-1">
      {eyebrow ? (
        <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-stone-500">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-base font-semibold leading-6 text-ink">{title}</Text>
      {description ? (
        <Text className="text-sm leading-6 text-stone-600">{description}</Text>
      ) : null}
    </View>
  );
}

export function Button({
  accessibilityLabel,
  accessibilityRole = "button",
  children,
  className = "",
  disabled,
  onPress,
  testID,
  variant = "primary",
}) {
  const buttonClassName =
    variant === "primary"
      ? disabled
        ? "bg-stone-300"
        : "bg-accent"
      : variant === "secondary"
        ? disabled
          ? "border-line bg-stone-100"
          : "border-line bg-white"
        : disabled
          ? "bg-stone-200"
          : "bg-ink";
  const textClassName =
    variant === "primary" || variant === "dark"
      ? disabled
        ? "text-white"
        : "text-white"
      : disabled
        ? "text-stone-400"
        : "text-ink";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      className={cx(
        "min-h-[52px] items-center justify-center rounded-[18px] px-5 py-3",
        variant === "secondary" ? "border" : "",
        buttonClassName,
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <Text className={cx("text-center text-sm font-semibold", textClassName)}>{children}</Text>
    </Pressable>
  );
}

export function Pill({ children, selected, className = "" }) {
  return (
    <View
      className={cx(
        "rounded-full border px-3 py-1.5",
        selected ? "border-accent bg-accent" : "border-line bg-cream",
        className,
      )}
    >
      <Text className={cx("text-xs font-semibold", selected ? "text-white" : "text-stone-700")}>
        {children}
      </Text>
    </View>
  );
}

export function QuietStatusPanel({ children, className = "" }) {
  return (
    <View className={cx("rounded-[18px] border border-line bg-cream px-4 py-4", className)}>
      {children}
    </View>
  );
}

export function ProductImageFrame({
  containerClassName = "h-28 w-28",
  image,
  imageClassName = "rounded-md",
  title,
}) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!image || hasImageError) {
    return (
      <View
        className={cx(
          "items-center justify-center rounded-[18px] border border-line bg-cream px-3",
          containerClassName,
        )}
      >
        <Text className="text-center text-xs font-semibold uppercase leading-4 tracking-[1px] text-stone-400">
          Image pending
        </Text>
      </View>
    );
  }

  return (
    <View className={cx("rounded-[18px] border border-line bg-white p-2", containerClassName)}>
      <Image
        accessibilityLabel={title}
        className={cx("h-full w-full", imageClassName)}
        onError={() => setHasImageError(true)}
        resizeMode="contain"
        source={{ uri: image }}
      />
    </View>
  );
}
