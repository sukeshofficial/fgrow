import React, { useState } from "react";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ClientDetailsForm from "./steps/ClientDetailsForm";
import ContactDetailsForm from "./steps/ContactDetailsForm";
import "../../styles/CreateClient.css";

const CreateClientWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    file_no: "",
    gstin: "",
    pan: "",
    group: "",
    tags: [],
    photo: null,
    // Future steps data
    primary_contact_name: "",
    primary_contact_mobile: "",
    primary_contact_email: "",
    primary_contact_role: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    }
  });

  const steps = [
    { label: "Client Details" },
    { label: "Contact Details" },
    { label: "Services" }
  ];

  const handleNext = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ClientDetailsForm 
            data={formData} 
            onNext={handleNext} 
          />
        );
      case 1:
        return (
          <ContactDetailsForm 
            data={formData} 
            onNext={handleNext} 
            onPrev={handlePrev}
          />
        );
      case 2:
        return <div className="step-placeholder">Services Implementation</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar />
      <div className="clients">
        <div className="create-client-container">
          <div className="wizard-card" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <Stepper steps={steps} currentStep={currentStep} />
            <div className="form-content">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default CreateClientWizard;
