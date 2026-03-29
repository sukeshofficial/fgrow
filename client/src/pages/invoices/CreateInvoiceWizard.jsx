import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import InvoiceDetailsForm from "./steps/InvoiceDetailsForm";
import InvoiceItemsForm from "./steps/InvoiceItemsForm";
import InvoiceReviewForm from "./steps/InvoiceReviewForm";
import { createInvoice, getNextInvoiceNumber } from "../../features/invoices/invoiceService";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import { useEffect } from "react";
import logger from "../../utils/logger.js";
import "../../styles/CreateClient.css";
import "./InvoiceWizard.css";

const CreateInvoiceWizard = () => {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    client_name: "",
    invoice_no: "",
    date: new Date().toISOString().slice(0, 10),
    due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().slice(0, 10),
    payment_term: "Net 15",
    remark: "",
    items: [],
    subtotal: 0,
    total_gst: 0,
    total_amount: 0
  });

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const response = await getNextInvoiceNumber();
        if (response.data?.invoice_no) {
          setFormData(prev => ({ ...prev, invoice_no: response.data.invoice_no }));
        }
      } catch (err) {
        logger.error("CreateInvoiceWizard", "Failed to fetch next invoice number", err);
      }
    };
    fetchNextNumber();
  }, []);

  const steps = [
    { label: "Invoice Details" },
    { label: "Invoice Items" },
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

  const handleSave = async (dataToSave) => {
    try {
      setLoading(true);
      const payload = {
        client: dataToSave.client,
        date: dataToSave.date,
        due_date: dataToSave.due_date,
        payment_term: dataToSave.payment_term,
        remark: dataToSave.remark,
        items: dataToSave.items,
        invoice_no: dataToSave.invoice_no
      };
      const response = await createInvoice(payload);
      navigate(`/finance/invoices/${response.data._id}`);
    } catch (err) {
      logger.error("CreateInvoiceWizard", "Create invoice failed", err);
      await showAlert(
        "Creation Failed",
        "Failed to create invoice: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spinner />
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <InvoiceDetailsForm
            data={formData}
            onNext={handleNext}
            onPrev={() => navigate("/finance/invoices")}
          />
        );
      case 1:
        return (
          <InvoiceItemsForm
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 2:
        return (
          <InvoiceReviewForm
            data={formData}
            onSubmit={() => handleSave(formData)}
            onBack={handlePrev}
            loading={loading}
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

export default CreateInvoiceWizard;
