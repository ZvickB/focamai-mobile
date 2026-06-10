import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { ChevronLeft } from "lucide-react-native";
import { appThemeTokens } from "../theme/themeTokens";

const wordmarkImage = require("../../assets/wordmark.png");

export const fontGuidance = "font-guidance";

export function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function ScreenContainer({
  backgroundElement,
  children,
  contentContainerStyle,
  fixedHeader,
  footer,
  keyboardShouldPersistTaps,
  onScroll,
  safeAreaEdges = ["bottom"],
  scrollEventThrottle,
  stickyHeaderIndices,
  testID,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const defaultHorizontalPadding = isCompact ? 16 : 24;

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      className="flex-1"
      style={{ backgroundColor: appThemeTokens.appBackground }}
      testID={testID}
    >
      {backgroundElement}
      {fixedHeader}
      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { gap: isCompact ? 16 : 20, paddingHorizontal: defaultHorizontalPadding, paddingVertical: 24 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        stickyHeaderIndices={stickyHeaderIndices}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          className={cx("border-t py-2", isCompact ? "px-4" : "px-6")}
          style={{
            backgroundColor: "#ffffff",
            borderColor: appThemeTokens.borderSubtle,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          {footer}
        </View>
      ) : null}
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

export function BrandWordmark({ className = "", imageClassName = "h-12 w-52", imageStyle }) {
  return (
    <View className={cx("items-start", className)}>
      <Image
        accessibilityLabel="Focamai"
        className={imageClassName}
        resizeMode="contain"
        source={wordmarkImage}
        style={imageStyle}
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
  const { width } = useWindowDimensions();
  const isCompact = width < 360;

  return (
    <Pressable
      accessibilityLabel={`Back to ${label.toLowerCase()}`}
      accessibilityRole="button"
      className="min-h-[44px] flex-row items-center gap-1 rounded-full pr-3"
      onPress={onPress}
      testID={testID}
    >
      <ChevronLeft color="#14222b" size={24} strokeWidth={2.3} />
      {isCompact ? null : <Text className="text-base font-semibold text-ink">{label}</Text>}
    </Pressable>
  );
}

export function AppHeader({
  left,
  right,
  wordmarkClassName = "h-9 w-36",
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const compactWordmarkClassName =
    wordmarkClassName === "h-9 w-36" || wordmarkClassName === "h-9 w-32"
      ? "h-8 w-28"
      : wordmarkClassName;

  return (
    <View className="relative min-h-[44px] w-full flex-row items-center justify-between">
      <View className={cx("z-10 flex-row items-center justify-start", isCompact ? "min-w-[72px]" : "min-w-[96px]")}>{left}</View>
      <BrandWordmark
        className="absolute inset-x-0 items-center"
        imageClassName={isCompact ? compactWordmarkClassName : wordmarkClassName}
      />
      <View className={cx("z-10 flex-row items-center justify-end gap-2", isCompact ? "min-w-[72px]" : "min-w-[96px]")}>{right}</View>
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

export function GuidanceText({ children, className = "", testID }) {
  return (
    <Text
      className={cx(fontGuidance, "text-[15px] leading-6 text-stone-600", className)}
      testID={testID}
    >
      {children}
    </Text>
  );
}

export function Button({
  accessibilityLabel,
  accessibilityRole = "button",
  children,
  className = "",
  disabled,
  onPress,
  style,
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
      style={style}
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

export function QuietStatusPanel({ children, className = "", ...props }) {
  return (
    <View className={cx("rounded-[18px] border border-line bg-cream px-4 py-4", className)} {...props}>
      {children}
    </View>
  );
}

export function RecoveryPanel({
  detail,
  message,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = "Try again",
  secondaryActionLabel,
  testID,
  title = "Something needs attention",
}) {
  const [showDetails, setShowDetails] = useState(false);
  const hasActions = Boolean(onPrimaryAction || (onSecondaryAction && secondaryActionLabel));

  return (
    <Surface className="border-secondary bg-white" testID={testID}>
      <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-accent">
        Recovery
      </Text>
      <Text className="mt-2 text-lg font-semibold leading-6 text-ink">{title}</Text>
      <Text className="mt-2 text-sm leading-5 text-stone-600">{message}</Text>

      {hasActions ? (
        <View className="mt-4 gap-2">
          {onPrimaryAction ? (
            <Button onPress={onPrimaryAction} variant="primary">
              {primaryActionLabel}
            </Button>
          ) : null}
          {onSecondaryAction && secondaryActionLabel ? (
            <Button onPress={onSecondaryAction} variant="secondary">
              {secondaryActionLabel}
            </Button>
          ) : null}
        </View>
      ) : null}

      {detail ? (
        <View className="mt-4 border-t border-line pt-3">
          <Pressable
            accessibilityLabel={showDetails ? "Hide recovery details" : "Show recovery details"}
            accessibilityRole="button"
            onPress={() => setShowDetails((currentValue) => !currentValue)}
          >
            <Text className="text-sm font-semibold text-accent">
              {showDetails ? "Hide details" : "Show details"}
            </Text>
          </Pressable>
          {showDetails ? (
            <Text className="mt-2 text-xs leading-4 text-stone-500">{detail}</Text>
          ) : null}
        </View>
      ) : null}
    </Surface>
  );
}

export function ProductImageFrame({
  containerClassName = "h-28 w-28",
  frameClassName = "rounded-[18px] border border-line bg-white p-2",
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
    <View className={cx(frameClassName, containerClassName)}>
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
