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

            {/* Task identity */}
            <div className="review-card" style={{ padding: '28px 32px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Task</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px' }}>{formData.title}</p>
              {formData.description && (
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{formData.description}</p>
              )}
            </div>

            {/* Details grid */}
            <div className="review-card" style={{ padding: '24px 32px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px 32px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Priority</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: formData.priority === 'high' ? '#fef2f2' : formData.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                    color: formData.priority === 'high' ? '#dc2626' : formData.priority === 'medium' ? '#d97706' : '#16a34a',
                  }}>{formData.priority || 'medium'}</span>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Due Date</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{formData.due_date ? new Date(formData.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Billable</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: formData.set_billable ? '#16a34a' : '#64748b', margin: 0 }}>{formData.set_billable ? '✓ Yes' : '✗ No'}</p>
                </div>
                {formData._userObjects?.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Assigned Members</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {formData._userObjects.map((u) => {
                        const avatar = u.profile_avatar?.secure_url || u.photo?.secure_url;
                        return (
                          <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px 6px 6px', background: '#f8fafc', borderRadius: '40px', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {avatar ? <img src={avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{u.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(formData._clientObj || formData._serviceObj) && (
              <div className="review-card" style={{ padding: '24px 32px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px 32px' }}>
                  {formData._clientObj && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Client</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {formData._clientObj.photo?.secure_url ? (
                          <img src={formData._clientObj.photo.secure_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
                            {(formData._clientObj.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{formData._clientObj.name}</span>
                      </div>
                    </div>
                  )}
                  {formData._serviceObj && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Service</p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{formData._serviceObj.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
