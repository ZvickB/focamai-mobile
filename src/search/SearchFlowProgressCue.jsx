import { Text, useWindowDimensions, View } from "react-native";

const stepOrder = ["search", "refine", "picks"];

const stepLabels = {
  search: "Search",
  refine: "Refine",
  picks: "Picks",
};

function getStepState(step, activeStep) {
  const stepIndex = stepOrder.indexOf(step);
  const activeIndex = stepOrder.indexOf(activeStep);

  if (stepIndex < activeIndex) {
    return "complete";
  }

  if (stepIndex === activeIndex) {
    return "current";
  }

  return "upcoming";
}

export function SearchFlowProgressCue({ activeStep = "search", testID }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const labelClassName = isCompact ? "text-[10px]" : "text-[11px]";
  const segmentClassName = isCompact ? "h-1" : "h-[5px]";
  const steps = stepOrder.map((step) => ({
    key: step,
    label: stepLabels[step],
    state: getStepState(step, activeStep),
  }));

  return (
    <View
      accessibilityLabel={`Search progress: ${stepLabels[activeStep] || "Search"} step`}
      className="w-full gap-1.5"
      testID={testID}
    >
      <View className="flex-row gap-1.5">
        {steps.map((step) => {
          const isCurrent = step.state === "current";
          const isComplete = step.state === "complete";

          return (
            <View
              key={step.key}
              className={
                isCurrent
                  ? `${segmentClassName} flex-1 rounded-full bg-ember`
                  : isComplete
                    ? `${segmentClassName} flex-1 rounded-full bg-accent`
                    : `${segmentClassName} flex-1 rounded-full bg-line`
              }
            />
          );
        })}
      </View>
      <View className="flex-row">
        {steps.map((step) => {
        const isCurrent = step.state === "current";
        const isComplete = step.state === "complete";
        const isUpcoming = step.state === "upcoming";

        return (
          <View className="flex-1 items-center" key={step.key}>
            <Text
              className={
                isUpcoming
                  ? `${labelClassName} font-semibold text-stone-400`
                  : isCurrent
                    ? `${labelClassName} font-semibold text-ember`
                    : `${labelClassName} font-semibold text-accent`
              }
            >
              {step.label}
            </Text>
          </View>
        );
      })}
      </View>
    </View>
  );
}
