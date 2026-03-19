import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ClientDetailsForm from "./steps/ClientDetailsForm";
import ContactDetailsForm from "./steps/ContactDetailsForm";
import { getClientById, updateClient } from "../../api/client.api";
import "../../styles/CreateClient.css";

const EditClientWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const resp = await getClientById(id);
        const clientData = resp.data.data;
        
        // Map backend data to frontend form state
        setFormData({
          name: clientData.name || "",
          file_no: clientData.file_no || "",
          gstin: clientData.gstin || "",
          pan: clientData.pan || "",
          group: clientData.group?._id || clientData.group || "",
          tags: clientData.tags?.map(t => t._id || t) || [],
          photo: clientData.photo || null,
          primary_contact_name: clientData.primary_contact_name || "",
          primary_contact_mobile: clientData.primary_contact_mobile || "",
          primary_contact_email: clientData.primary_contact_email || "",
          primary_contact_role: clientData.primary_contact_role || "",
          address: {
            street: clientData.address?.street || "",
            city: clientData.address?.city || "",
            state: clientData.address?.state || "",
            postalCode: clientData.address?.postalCode || "",
            country: clientData.address?.country || "India"
          }
        });
      } catch (err) {
        console.error("Failed to fetch client:", err);
        setError("Could not load client details");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleNext = async (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    // If it's the last step (or we want to save on each step), call update
    // For now, let's just advance the step
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSave(updatedData);
    }
  };

  const handleSave = async (dataToSave) => {
    try {
      setLoading(true);
      await updateClient(id, dataToSave);
      navigate("/clients");
    } catch (err) {
      console.error("Failed to update client:", err);
      alert("Failed to update client: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    if (loading && currentStep === 0) return <div className="step-placeholder">Loading client data...</div>;
    if (error) return <div className="step-placeholder">{error}</div>;

    switch (currentStep) {
      case 0:
        return (
          <ClientDetailsForm 
            data={formData} 
            onNext={handleNext}
            isEdit={true}
          />
        );
      case 1:
        return (
          <ContactDetailsForm 
            data={formData} 
            onNext={handleNext} 
            onPrev={handlePrev}
            isEdit={true}
          />
        );
      case 2:
        return (
          <div className="step-container">
            <h2 className="form-title">Services & Settings</h2>
            <div className="step-placeholder" style={{ padding: '40px 0' }}>
              Services update implementation coming soon...
            </div>
            <div className="next-button-container" style={{ marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="prev-button" onClick={handlePrev} style={{ background: '#f1f5f9', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                Back
              </button>
              <button className="next-button" onClick={() => handleSave(formData)}>
                Update Client
              </button>
            </div>
          </div>
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

export default EditClientWizard;
