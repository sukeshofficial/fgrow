import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import SideBar from "../../components/SideBar";
import TaskBasicInfoForm from "./steps/TaskBasicInfoForm";
import TaskAssignmentForm from "./steps/TaskAssignmentForm";
import { createTask } from "../../api/task.api";
import "../../styles/CreateClient.css"; 
import "../../styles/Tasks.css";

const CreateTaskWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    client: "",
    service: "",
    users: [], // Array of user IDs
    tags: [],
    is_billable: false,
  });

  const steps = [
    { label: "Basic Info" },
    { label: "Links & Assignment" },
    { label: "Review & Create" }
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

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = async (dataToSave) => {
    try {
      setLoading(true);
      const resp = await createTask(dataToSave);
      if (resp.data.success) {
        navigate("/tasks");
      }
    } catch (err) {
      console.error("Task creation failed", err);
      alert("Failed to create task: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (loading) return <div className="step-placeholder">Creating task...</div>;

    switch (currentStep) {
      case 0:
        return (
          <TaskBasicInfoForm data={formData} onNext={handleNext} />
        );
      case 1:
        return (
          <TaskAssignmentForm 
            data={formData} 
            onNext={handleNext} 
            onPrev={handlePrev} 
          />
        );
      case 2:
        return (
          <div className="step-container">
            <h2 className="form-title">Review & Create</h2>
            <div className="review-card" style={{ padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Title</label>
                  <p style={{ fontWeight: '600', margin: '4px 0 16px' }}>{formData.title}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority</label>
                  <p style={{ fontWeight: '600', margin: '4px 0 16px', color: formData.priority === 'high' ? 'var(--error-red)' : 'inherit' }}>{formData.priority}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</label>
                  <p style={{ fontWeight: '600', margin: '4px 0 16px' }}>{formData.due_date || "Not set"}</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billable</label>
                    <p style={{ fontWeight: '600', margin: '4px 0 16px' }}>{formData.is_billable ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
            <div className="wizard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="back-btn" onClick={handlePrev}>Back</button>
              <button className="next-button" onClick={() => handleSave(formData)} style={{ position: 'static', margin: 0 }}>
                Create Task
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
      <SideBar />
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
           .wizard-footer {
          display: flex;
          justify-content: flex-start;
          margin-top: 20px;
        }
        .back-btn {
          background: none;
          border: 1px solid var(--border-color);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
};

export default CreateTaskWizard;
