import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ServiceDetailsForm from "./steps/ServiceDetailsForm";
import ServiceBillingForm from "./steps/ServiceBillingForm";
import { createService } from "../../api/service.api";
import { Spinner } from "../../components/ui/Spinner";
import logger from "../../utils/logger.js";
import "../../styles/CreateClient.css";
import { FaCog, FaMoneyBillWave, FaCheckDouble } from "react-icons/fa";

const CreateServiceWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sac_code: "",
    gst_rate: 18,
    default_billing_rate: 0,
    is_recurring: false,
    billable_by_default: true,
    is_enabled: true
  });

  const steps = [
    { label: "Service Details", icon: <FaCog /> },
    { label: "Billing & Config", icon: <FaMoneyBillWave /> },
    { label: "Review & Activate", icon: <FaCheckDouble /> }
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
      await createService(dataToSave);
      navigate("/services");
    } catch (err) {
      logger.error("CreateServiceWizard", "Create failed", err);
      alert("Failed to create service: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      navigate("/services");
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div className="step-placeholder" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spinner />
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <ServiceDetailsForm
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 1:
        return (
          <ServiceBillingForm
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 2:
        return (
          <div className="step-container">
            <h2 className="form-title">Review & Activate</h2>
            <div className="review-card" style={{
              padding: '48px',
              textAlign: 'center',
              background: 'white',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              marginBottom: '32px'
            }}>
              <div className="review-icon-wrapper" style={{
                width: '80px',
                height: '80px',
                background: '#f5f3ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--primary-accent)',
                fontSize: '32px'
              }}>
                ✨
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Ready to go!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Check your service configuration one last time.</p>

              <div className="review-details" style={{
                textAlign: 'left',
                background: '#f8fafc',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '32px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Service Name</label>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formData.name}</div>
                  </div>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>SAC Code</label>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formData.sac_code || "Not set"}</div>
                  </div>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Billing Rate</label>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>₹{formData.default_billing_rate.toLocaleString()}</div>
                  </div>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Tax Type</label>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>GST {formData.gst_rate}%</div>
                  </div>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Service Type</label>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formData.is_recurring ? "Recurring Subscription" : "One-time Service"}</div>
                  </div>
                  <div className="review-item">
                    <label style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Status</label>
                    <div style={{ fontWeight: '600', color: formData.is_enabled ? '#059669' : '#94a3b8' }}>{formData.is_enabled ? "Auto-enable" : "Draft"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="wizard-footer">
              <button type="button" className="back-btn" onClick={handlePrev}>
                Back to Billing
              </button>
              <button
                type="button"
                className="next-button"
                onClick={() => handleSave(formData)}
                style={{ position: 'static' }}
              >
                {loading ? "Creating..." : "Create & Activate Service"}
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
      <div className="clients"> {/* Use 'clients' class for consistent background/layout */}
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

export default CreateServiceWizard;
