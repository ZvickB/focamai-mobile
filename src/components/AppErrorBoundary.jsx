import { Component } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { captureReactError } from "../lib/sentry";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    captureReactError(error, errorInfo);
    if (__DEV__) {
      console.error(
        `[Focamai] uncaught render error\n${error?.message || String(error)}\n\nJavaScript stack:\n${error?.stack || "Unavailable"}\n\nComponent stack:\n${errorInfo?.componentStack || "Unavailable"}`,
      );
    }
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-[#faf9f7] px-6">
          <Text className="text-lg font-semibold text-stone-800">Something went wrong</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-stone-500">
            An unexpected error occurred. Tap below to try again.
          </Text>
          <Pressable
            onPress={() => this.reset()}
            className="mt-6 rounded-full bg-[#0F6175] px-6 py-3"
          >
            <Text className="text-sm font-semibold text-white">Try again</Text>
          </Pressable>
          {__DEV__ ? (
            <ScrollView className="mt-6 max-h-48 w-full rounded-lg bg-stone-100 p-4">
              <Text className="font-mono text-xs text-stone-600">
                {this.state.error.toString()}
              </Text>
            </ScrollView>
          ) : null}
        </View>
      );
    }

    return this.props.children;
  }
}
