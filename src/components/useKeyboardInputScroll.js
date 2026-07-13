import { useEffect, useRef } from "react";
import { Keyboard, Platform, TextInput } from "react-native";

const FOCUSED_INPUT_TOP_GUTTER = 24;
const KEYBOARD_LAYOUT_SETTLE_MS = 80;

// Keeps the focused TextInput visible above the software keyboard. Screens pass
// scrollViewRef to their ScreenContainer and handleInputFocus to each TextInput's
// onFocus, alongside a platform-aware KeyboardAvoidingView wrapper. On some
// Android layouts the KeyboardAvoidingView alone is not enough — the focused
// input can stay hidden behind the keyboard — so this also scrolls the exact
// focused input into view after the native keyboard layout settles.
export function useKeyboardInputScroll() {
  const scrollViewRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  function scrollFocusedInputIntoView() {
    const scrollView = scrollViewRef.current;
    const focusedInput = TextInput.State.currentlyFocusedInput();

    if (!scrollView || !focusedInput) {
      return;
    }

    focusedInput.measureLayout(
      scrollView,
      (_left, top) => {
        scrollView.scrollTo({
          animated: true,
          y: Math.max(0, top - FOCUSED_INPUT_TOP_GUTTER),
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
