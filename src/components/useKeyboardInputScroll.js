import { useEffect, useRef } from "react";
import { Keyboard, Platform, TextInput } from "react-native";

const FOCUSED_INPUT_TOP_GUTTER = 24;
const SCROLL_TARGET_BOTTOM_GUTTER = 20;
const KEYBOARD_LAYOUT_SETTLE_MS = 80;

// Keeps the focused TextInput visible above the software keyboard. Screens pass
// scrollViewRef to their ScreenContainer and handleInputFocus to each TextInput's
// onFocus, alongside a platform-aware KeyboardAvoidingView wrapper. On some
// Android layouts the KeyboardAvoidingView alone is not enough — the focused
// input can stay hidden behind the keyboard — so this also scrolls the exact
// focused input into view after the native keyboard layout settles.
export function useKeyboardInputScroll({ scrollTargetRef } = {}) {
  const scrollViewRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  function scrollFocusedInputIntoView() {
    const scrollView = scrollViewRef.current;
    const focusedInput = TextInput.State.currentlyFocusedInput();
    const scrollTarget = scrollTargetRef?.current || focusedInput;

    if (!scrollView || !focusedInput || !scrollTarget) {
      return;
    }

    scrollTarget.measureLayout(
      scrollView,
      (_left, top, _width, targetHeight) => {
        scrollView.measure((_x, _y, _width, viewportHeight) => {
          // A retry note needs its submit button visible too. When a screen
          // supplies that button as the target, place its bottom just above
          // the resized ScrollView edge; other inputs keep the prior gutter.
          const targetOffset = scrollTargetRef?.current
            ? Math.max(
                FOCUSED_INPUT_TOP_GUTTER,
                viewportHeight - targetHeight - SCROLL_TARGET_BOTTOM_GUTTER,
              )
            : FOCUSED_INPUT_TOP_GUTTER;

          scrollView.scrollTo({
            animated: true,
            y: Math.max(0, top - targetOffset),
          });
        });
      },
      () => {},
    );
  }

  function scheduleFocusedInputIntoView() {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Native layout settles after the keyboard animation starts.
    scrollTimeoutRef.current = setTimeout(scrollFocusedInputIntoView, KEYBOARD_LAYOUT_SETTLE_MS);
  }

  function handleInputFocus() {
    scheduleFocusedInputIntoView();
  }

  useEffect(() => {
    const keyboardEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardSubscription = Keyboard.addListener(keyboardEvent, () => {
      if (TextInput.State.currentlyFocusedInput()) {
        scheduleFocusedInputIntoView();
      }
    });

    return () => {
      keyboardSubscription.remove();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { handleInputFocus, scrollViewRef };
}
