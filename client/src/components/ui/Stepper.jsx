import React from "react";

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="stepper-container">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${onStepClick ? "clickable" : ""}`}
            aria-current={isActive ? "step" : undefined}
            onClick={() => onStepClick && onStepClick(index)}
            style={{ cursor: onStepClick ? 'pointer' : 'default' }}
          >
            <div className="step-circle">
              {step.icon ? (
                <span className="step-icon">{step.icon}</span>
              ) : isCompleted ? (
                "✓"
              ) : (
                index + 1
              )}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
