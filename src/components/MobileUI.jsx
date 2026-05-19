import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

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
          { gap: 20, paddingHorizontal: 20, paddingVertical: 24 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </ScrollView>
      {footer ? <View className="border-t border-line bg-white px-5 py-3">{footer}</View> : null}
    </SafeAreaView>
  );
}

export function ScreenIntro({ eyebrow, title, description, testID }) {
  return (
    <View>
      {eyebrow ? (
        <Text className="text-[12px] font-semibold uppercase tracking-[1.8px] text-accent">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mt-2 text-[30px] font-semibold leading-[37px] text-ink" testID={testID}>
        {title}
      </Text>
      {description ? (
        <Text className="mt-3 text-base leading-6 text-stone-600">{description}</Text>
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
        "rounded-lg border px-4 py-4 shadow-sm",
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
    <View>
      {eyebrow ? (
        <Text className="text-xs font-semibold uppercase tracking-[1.3px] text-stone-500">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-sm font-semibold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-1 text-sm leading-5 text-stone-600">{description}</Text>
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
        "min-h-[48px] items-center justify-center rounded-lg px-4 py-3",
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
    <View className={cx("rounded-lg border border-line bg-cream px-3 py-3", className)}>
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
          "items-center justify-center rounded-lg border border-line bg-cream px-3",
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
    <View className={cx("rounded-lg border border-line bg-white p-2", containerClassName)}>
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
