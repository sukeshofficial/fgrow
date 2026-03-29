import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ServiceDetailsForm from "./steps/ServiceDetailsForm";
import ServiceBillingForm from "./steps/ServiceBillingForm";
import { getServiceById, updateService } from "../../api/service.api";
import logger from "../../utils/logger.js";
import "../../styles/CreateClient.css";
import { FaCog, FaMoneyBillWave, FaCheckDouble } from "react-icons/fa";

const EditServiceWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    { label: "Review & Update", icon: <FaCheckDouble /> }
  ];

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const resp = await getServiceById(id);
        if (resp.data.success) {
          const s = resp.data.data;
          setFormData({
            name: s.name || "",
            description: s.description || "",
            sac_code: s.sac_code || "",
            gst_rate: s.gst_rate || 18,
            default_billing_rate: s.default_billing_rate || 0,
            is_recurring: s.is_recurring || false,
            billable_by_default: s.billable_by_default !== undefined ? s.billable_by_default : true,
            is_enabled: s.is_enabled !== undefined ? s.is_enabled : true
          });
        }
      } catch (err) {
        logger.error("EditServiceWizard", "Failed to fetch service", err);
        setError("Failed to load service details. It might have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

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
      await updateService(id, dataToSave);
      navigate("/services");
    } catch (err) {
      logger.error("EditServiceWizard", "Update failed", err);
      alert("Failed to update service: " + (err.response?.data?.message || err.message));
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
    if (loading && currentStep === 0) return <div className="step-placeholder">Loading service data...</div>;
    if (error) return <div className="step-placeholder" style={{ color: 'var(--error-red)' }}>{error}</div>;

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
            <h2 className="form-title">Review & Update</h2>

            <div
              className="review-card"
              style={{
                padding: "48px",
                textAlign: "center",
                background: "white",
                borderRadius: "24px",
                border: "1px solid var(--border-color)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                marginBottom: "32px",
              }}
            >
              <div
                className="review-icon-wrapper"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "#f5f3ff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  color: "var(--primary-accent)",
                  fontSize: "32px",
                }}
              >
                ✏️
              </div>

              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "var(--text-main)",
                  marginBottom: "8px",
                }}
              >
                Update Changes
              </h3>

              <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
                Check your updated configurations before saving.
              </p>

              <div
                className="review-details"
                style={{
                  textAlign: "left",
                  background: "#f8fafc",
                  padding: "24px",
                  borderRadius: "16px",
                  marginBottom: "32px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="review-item">
                    <label className="label">Service Name</label>
                    <div>{formData.name}</div>
                  </div>

                  <div className="review-item">
                    <label className="label">SAC Code</label>
                    <div>{formData.sac_code || "Not set"}</div>
                  </div>

                  <div className="review-item">
                    <label className="label">Billing Rate</label>
                    <div>₹{formData.default_billing_rate.toLocaleString()}</div>
                  </div>

                  <div className="review-item">
                    <label className="label">Tax Type</label>
                    <div>GST {formData.gst_rate}%</div>
                  </div>

                  <div className="review-item">
                    <label className="label">Service Type</label>
                    <div>
                      {formData.is_recurring
                        ? "Recurring Subscription"
                        : "One-time Service"}
                    </div>
                  </div>

                  <div className="review-item">
                    <label className="label">Status</label>
                    <div
                      style={{
                        color: formData.is_enabled ? "#059669" : "#f43f5e",
                      }}
                    >
                      {formData.is_enabled ? "Active" : "Disabled"}
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
                  disabled={loading}
                  style={{ position: "static" }}
                >
                  {loading ? "Updating..." : "Save & Update Service"}
                </button>
              </div>
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

export default EditServiceWizard;
