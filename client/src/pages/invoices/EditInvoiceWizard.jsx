import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import Stepper from "../../components/ui/Stepper";
import InvoiceDetailsForm from "./steps/InvoiceDetailsForm";
import InvoiceItemsForm from "./steps/InvoiceItemsForm";
import InvoiceReviewForm from "./steps/InvoiceReviewForm";
import { getInvoiceById, updateInvoice } from "../../features/invoices/invoiceService";
import { Spinner } from "../../components/ui/Spinner";
import "../../styles/CreateClient.css";
import "./InvoiceWizard.css";

const EditInvoiceWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client: "",
    client_name: "",
    invoice_no: "",
    date: "",
    due_date: "",
    payment_term: "Net 15",
    remark: "",
    items: [],
    subtotal: 0,
    total_gst: 0,
    total_amount: 0
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await getInvoiceById(id);
        const inv = response.data;
        setFormData({
          client: inv.client?._id || inv.client,
          client_name: inv.client?.name || "",
          invoice_no: inv.invoice_no || "",
          date: inv.date ? new Date(inv.date).toISOString().slice(0, 10) : "",
          due_date: inv.due_date ? new Date(inv.due_date).toISOString().slice(0, 10) : "",
          payment_term: inv.payment_term || "Net 15",
          remark: inv.remark || "",
          items: (inv.items || []).map(it => ({
            ...it,
            source_id: it.source_id ? it.source_id.toString() : null
          })),
          subtotal: inv.subtotal || 0,
          total_gst: inv.total_gst || 0,
          total_amount: inv.total_amount || 0
        });
      } catch (err) {
        console.error("Failed to fetch invoice", err);
        navigate("/finance/invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const steps = [
    { label: "Invoice Details" },
    { label: "Invoice Items" },
    { label: "Review & Update" }
  ];

  const handleNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        client: formData.client,
        date: formData.date,
        due_date: formData.due_date,
        payment_term: formData.payment_term,
        remark: formData.remark,
        items: formData.items,
        invoice_no: formData.invoice_no
      };
      await updateInvoice(id, payload);
      navigate(`/finance/invoices/${id}`);
    } catch (err) {
      console.error("Update invoice failed", err);
      alert("Failed to update invoice: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="clients">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spinner />
          </div>
        </div>
      </>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <InvoiceDetailsForm
            data={formData}
            onNext={handleNext}
            onPrev={() => navigate(`/finance/invoices/${id}`)}
          />
        );
      case 1:
        return (
          <InvoiceItemsForm
            data={formData}
            onNext={handleNext}
            onPrev={handleBack}
          />
        );
      case 2:
        return (
          <InvoiceReviewForm
            data={formData}
            onBack={handleBack}
            onSubmit={handleFinalSubmit}
            loading={submitting}
            isEdit={true}
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

export default EditInvoiceWizard;
