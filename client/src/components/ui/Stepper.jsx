import React from "react";

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="stepper-container">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div 
            key={index} 
            className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            aria-current={isActive ? "step" : undefined}
          >
            <div className="step-circle">
              {isCompleted ? "✓" : index + 1}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
