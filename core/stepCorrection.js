// core/stepCorrection.js

export function createStepCorrection({
  stepCount
}) {
  let currentStepIndex = 0;
  let isActive = false;

  function start() {
    currentStepIndex = 0;
    isActive = true;

    return currentStepIndex;
  }

  function next() {
    if (!isActive) {
      return currentStepIndex;
    }

    if (
      currentStepIndex >=
      stepCount - 1
    ) {
      return currentStepIndex;
    }

    currentStepIndex += 1;

    return currentStepIndex;
  }

  function previous() {
    if (!isActive) {
      return currentStepIndex;
    }

    if (
      currentStepIndex <= 0
    ) {
      return currentStepIndex;
    }

    currentStepIndex -= 1;

    return currentStepIndex;
  }

  function stop() {
    isActive = false;
  }

  function getCurrentStepIndex() {
    return currentStepIndex;
  }

  function getIsActive() {
    return isActive;
  }

  function getIsLastStep() {
    return (
      currentStepIndex ===
      stepCount - 1
    );
  }

  return {
    start,
    next,
    previous,
    stop,
    getCurrentStepIndex,
    getIsActive,
    getIsLastStep
  };
}