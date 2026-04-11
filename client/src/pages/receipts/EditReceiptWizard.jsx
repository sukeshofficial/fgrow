import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Stepper from "../../components/ui/Stepper";
import Sidebar from "../../components/SideBar";
import ReceiptBasicInfoForm from "./steps/ReceiptBasicInfoForm";
import ReceiptPaymentForm from "./steps/ReceiptPaymentForm";
import ReceiptApplicationForm from "./steps/ReceiptApplicationForm";
import receiptService from "../../features/receipts/receiptService";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger.js";
import "../../styles/CreateClient.css";
import "../invoices/InvoiceWizard.css";
import { FiUser, FiCreditCard, FiLink } from "react-icons/fi";

const EditReceiptWizard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        receipt_no: "",
        client: "",
        billing_entity: "",
        date: new Date().toISOString().slice(0, 10),
        remark: "",
        payments: [{ amount: 0, date: new Date().toISOString().slice(0, 10), payment_mode: "Bank Transfer", reference: "", note: "" }],
        received_amount: 0,
        tds_amount: 0,
        discount: 0,
        round_off: 0,
        total_amount: 0,
        allocations: [] // Not used for edit path as much, but kept for parity
    });

    const steps = [
        { label: "Basic Info", icon: <FiUser /> },
        { label: "Payment Details", icon: <FiCreditCard /> },
        { label: "Settlement", icon: <FiLink /> }
    ];

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                setLoading(true);
                const response = await receiptService.getReceipt(id);
                const r = response.data;

                if (r.status === 'settled') {
                    showAlert("Edit Restricted", "Settled receipts cannot be edited. Please unapply invoices first.", "warning");
                    navigate(`/finance/receipts/${id}`);
                    return;
                }

                setFormData({
                    receipt_no: r.receipt_no || "",
                    client: r.client?._id || r.client,
                    billing_entity: r.billing_entity?._id || r.billing_entity,
                    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
                    remark: r.remark || "",
                    payments: (r.payments || []).map(p => ({
                        ...p,
                        date: p.date ? new Date(p.date).toISOString().slice(0, 10) : ""
                    })),
                    received_amount: r.received_amount || 0,
                    tds_amount: r.tds_amount || 0,
                    discount: r.discount || 0,
                    round_off: r.round_off || 0,
                    total_amount: r.total_amount || 0,
                    allocations: (r.applied_invoices || []).map(a => ({
                        invoiceId: a.invoice,
                        amount: a.amount_applied
                    }))
                });
            } catch (err) {
                logger.error("EditReceiptWizard", "Failed to load receipt", err);
                showAlert("Error", "Failed to load receipt data.", "error");
                navigate("/finance/receipts");
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
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
            setSubmitting(true);
            const payload = {
                receipt_no: dataToSave.receipt_no,
                date: dataToSave.date,
                remark: dataToSave.remark,
                payments: dataToSave.payments,
                tds_amount: Number(dataToSave.tds_amount || 0),
                discount: Number(dataToSave.discount || 0),
                round_off: Number(dataToSave.round_off || 0),
            };

            await receiptService.updateReceipt(id, payload);

            // If there are NEW allocations in the third step, they would be handled by the form component call
            // But usually for edit, we just redirect back to detail
            navigate(`/finance/receipts/${id}`);
            showAlert("Success", "Receipt updated successfully!", "success");
        } catch (err) {
            logger.error("EditReceiptWizard", "Update failed", err);
            showAlert("Update Failed", err.response?.data?.message || err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const renderStep = () => {
        if (loading) return null;

        switch (currentStep) {
            case 0:
                return (
                    <ReceiptBasicInfoForm
                        data={formData}
                        onNext={handleNext}
                        onPrev={() => navigate(`/finance/receipts/${id}`)}
                        isEdit={true}
                    />
                );
            case 1:
                return (
                    <ReceiptPaymentForm
                        data={formData}
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                );
            case 2:
                return (
                    <ReceiptApplicationForm
                        data={formData}
                        onSubmit={(allocations) => {
                            // For edit, we might want to just handle the update and then apply
                            handleSave({ ...formData, allocations });
                        }}
                        onBack={handlePrev}
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
            <div className="finance">
                <div className="create-client-container">
                    <div className="wizard-card" style={{ animation: 'slideUp 0.4s ease-out' }}>
                        {/* Left Sidebar */}
                        <div className="wizard-sidebar">
                            <Stepper steps={steps} currentStep={currentStep} />
                        </div>

                        {/* Right Content */}
                        <div className="form-content">
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                                    <Spinner />
                                </div>
                            ) : renderStep()}
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

export default EditReceiptWizard;
