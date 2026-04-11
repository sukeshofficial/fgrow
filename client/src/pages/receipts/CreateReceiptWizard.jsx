import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { FaUser, FaCreditCard, FaLink } from "react-icons/fa";

const CreateReceiptWizard = () => {
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

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
        allocations: [] // [{ invoiceId, amount }]
    });

    const steps = [
        { label: "Basic Info", icon: <FaUser /> },
        { label: "Payment Details", icon: <FaCreditCard /> },
        { label: "Apply to Invoices", icon: <FaLink /> }
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
                receipt_no: dataToSave.receipt_no,
                client: dataToSave.client,
                billing_entity: dataToSave.billing_entity,
                date: dataToSave.date,
                remark: dataToSave.remark,
                payments: dataToSave.payments,
                tds_amount: Number(dataToSave.tds_amount || 0),
                discount: Number(dataToSave.discount || 0),
                round_off: Number(dataToSave.round_off || 0),
                status: "draft"
            };

            const response = await receiptService.createReceipt(payload);
            const receiptId = response.data._id;

            // If there are allocations, apply them
            if (dataToSave.allocations && dataToSave.allocations.length > 0) {
                await receiptService.applyToInvoices(receiptId, dataToSave.allocations);
            }

            navigate(`/finance/receipts/${receiptId}`);
        } catch (err) {
            logger.error("CreateReceiptWizard", "Create receipt failed", err);
            await showAlert(
                "Creation Failed",
                "Failed to create receipt: " + (err.response?.data?.message || err.message),
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
                    <ReceiptBasicInfoForm
                        data={formData}
                        onNext={handleNext}
                        onPrev={() => navigate("/finance/receipts")}
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
                        onSubmit={(allocations) => handleSave({ ...formData, allocations })}
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
                        {/* Left Sidebar */}
                        <div className="wizard-sidebar">
                            <div className="wizard-header" style={{ padding: '0 8px 24px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>New Receipt</h2>
                                <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>Create a new payment receipt and allocate funds.</p>
                            </div>
                            <Stepper steps={steps} currentStep={currentStep} />
                        </div>

                        {/* Right Content */}
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

export default CreateReceiptWizard;
