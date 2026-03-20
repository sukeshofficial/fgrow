import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ClientDetailsForm from "./steps/ClientDetailsForm";
import ContactDetailsForm from "./steps/ContactDetailsForm";
import ClientServicesForm from "./steps/ClientServicesForm";
import { createClient } from "../../api/client.api";
import "../../styles/CreateClient.css";

const CreateClientWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    file_no: "",
    gstin: "",
    pan: "",
    group: "",
    tags: [],
    photo: null,
    primary_contact_name: "",
    primary_contact_mobile: "",
    primary_contact_email: "",
    primary_contact_role: "",
    contacts: [],
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    },
    recurring_services: [],
    service_assignments: [],
    billing_profile: "",
    opening_balance: {
        enabled: false,
        amount: 0,
        type: "debit",
        as_of: new Date().toISOString().split('T')[0],
        currency: "INR"
    }
  });

  const steps = [
    { label: "Client Details" },
    { label: "Contact Details" },
    { label: "Services" }
  ];

  const handleNext = (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave(updatedData);
    }
  };

  const handleSave = async (dataToSave) => {
    try {
      setLoading(true);
      await createClient(dataToSave);
      navigate("/clients");
    } catch (err) {
      console.error("Create failed", err);
      alert("Failed to create client: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    if (loading) return <div className="step-placeholder">Processing...</div>;

    switch (currentStep) {
      case 0:
        return (
          <ClientDetailsForm 
            data={formData} 
            onNext={handleNext} 
            onPrev={() => navigate("/clients")}
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
        return (
          <ClientServicesForm 
            data={formData} 
            onNext={handleNext} 
            onPrev={handlePrev}
          />
        );
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
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default CreateClientWizard;
