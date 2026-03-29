import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import SideBar from "../../components/SideBar";
import TaskBasicInfoForm from "./steps/TaskBasicInfoForm";
import TaskAssignmentForm from "./steps/TaskAssignmentForm";
import { getTask, updateTask } from "../../api/task.api";
import "../../styles/CreateClient.css";
import "../../styles/Tasks.css";
import { Spinner } from "../../components/ui/Spinner";
import logger from "../../utils/logger.js";
import { FaClipboardList, FaLink, FaCheckDouble, FaArrowRight, FaArrowLeft, FaSave } from "react-icons/fa";

const EditTaskWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const resp = await getTask(id);
        if (resp.data.success) {
          const task = resp.data.data;
          setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
            client: task.client?._id || "",
            service: task.service?._id || "",
            users: task.users?.map(u => u._id) || [],
            tags: task.tags?.map(t => t._id) || [],
            set_billable: task.is_billable,
          });
        }
      } catch (err) {
        logger.error("EditTaskWizard", "Failed to fetch task", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const steps = [
    { label: "Basic Info", icon: <FaClipboardList /> },
    { label: "Links & Assignment", icon: <FaLink /> },
    { label: "Review & Save", icon: <FaCheckDouble /> }
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
      setSaving(true);
      const resp = await updateTask(id, dataToSave);
      if (resp.data.success) {
        navigate(`/tasks/${id}`);
      }
    } catch (err) {
      logger.error("EditTaskWizard", "Task update failed", err);
      alert("Failed to update task: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner />
      </div>
    );
  }

  const renderStep = () => {
    if (saving) {
      return (
        <div className="step-placeholder" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spinner />
        </div>
      );
    }

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
            <h2 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--primary-accent)', fontSize: '22px', display: 'flex' }}><FaCheckDouble /></span>
              Review & Save
            </h2>
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
              </div>
            </div>
            <div className="wizard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="back-btn" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaArrowLeft size={12} /> Back
              </button>
              <button className="next-button" onClick={() => handleSave(formData)} style={{ position: 'static', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaSave size={12} /> Save Changes
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
          <div className="wizard-card">
            <Stepper steps={steps} currentStep={currentStep} />
            <div className="form-content">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditTaskWizard;
