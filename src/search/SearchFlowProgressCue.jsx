import { Check } from "lucide-react-native";
import { Text, View } from "react-native";

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
  const steps = stepOrder.map((step) => ({
    key: step,
    label: stepLabels[step],
    state: getStepState(step, activeStep),
  }));

  return (
    <View
      accessibilityLabel={`Search progress: ${stepLabels[activeStep] || "Search"} step`}
      className="flex-row items-start justify-center"
      testID={testID}
    >
      {steps.map((step, index) => {
        const isCurrent = step.state === "current";
        const isComplete = step.state === "complete";
        const isMuted = step.state === "upcoming";

        return (
          <View className="flex-row items-start" key={step.key}>
            <View className="items-center">
              <View
                className={
                  isMuted
                    ? "h-7 w-7 items-center justify-center rounded-full border border-line bg-mist"
                    : isCurrent
                      ? "h-7 w-7 items-center justify-center rounded-full bg-ember"
                      : "h-7 w-7 items-center justify-center rounded-full bg-accent"
                }
              >
                {isComplete ? <Check color="#ffffff" size={15} strokeWidth={2.5} /> : null}
              </View>
              <Text
                className={
                  isMuted
                    ? "mt-2 text-xs font-semibold text-stone-400"
                    : isCurrent
                      ? "mt-2 text-xs font-semibold text-ember"
                      : "mt-2 text-xs font-semibold text-accent"
                }
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 ? (
              <View
                className={
                  isMuted ? "mt-[13px] h-px w-20 bg-line" : "mt-[13px] h-px w-20 bg-secondary"
                }
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
