import React, { useState, useEffect } from "react";
import FormField from "../../../components/ui/FormField";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listClients } from "../../../api/client.api";
import { FiFile, FiCalendar, FiClock, FiMessageSquare, FiHash, FiRefreshCcw } from "react-icons/fi";
import logger from "../../../utils/logger.js";
import { getNextInvoiceNumber, resetInvoiceCounter } from "../../../features/invoices/invoiceService";

const InvoiceDetailsForm = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState({
    client: data.client || "",
    client_name: data.client_name || "",
    invoice_no: data.invoice_no || "",
    date: data.date || new Date().toISOString().slice(0, 10),
    due_date: data.due_date || "",
    payment_term: data.payment_term || "Net 15",
    remark: data.remark || ""
  });

  useEffect(() => {
    if (data.invoice_no && !formData.invoice_no) {
      setFormData(prev => ({ ...prev, invoice_no: data.invoice_no }));
    }
  }, [data.invoice_no]);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [resetModal, setResetModal] = useState({ open: false, value: "" });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await listClients({ is_active: true, limit: 100 });
        setClients(response.data.data || []);
      } catch (error) {
        logger.error("InvoiceDetailsForm", "Failed to fetch clients", error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    if (name === "client") {
      const selectedClient = clients.find(c => c._id === value);
      if (selectedClient) {
        updates.client_name = selectedClient.name;
      } else {
        updates.client_name = "";
      }
    }

    if (name === "date") {
      const oldDate = new Date(formData.date);
      const newDate = new Date(value);

      const oldMonth = oldDate.getMonth();
      const oldCalYear = oldDate.getFullYear();
      const oldFy = oldMonth >= 3 ? oldCalYear : oldCalYear - 1;
      const oldFyStr = `${oldFy % 100}-${(oldFy + 1) % 100}`;

      const newMonth = newDate.getMonth();
      const newCalYear = newDate.getFullYear();
      const newFy = newMonth >= 3 ? newCalYear : newCalYear - 1;
      const newFyStr = `${newFy % 100}-${(newFy + 1) % 100}`;

      if (oldFyStr !== newFyStr && formData.invoice_no && typeof formData.invoice_no === 'string' && formData.invoice_no.startsWith(`INV/${oldFyStr}/`)) {
        const seq = formData.invoice_no.split('/').pop();
        updates.invoice_no = `INV/${newFyStr}/${seq}`;
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <>
      <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 className="form-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Essential Details</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Start with basic invoice information and client selection.</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-form-layout">
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            marginBottom: '32px'
          }}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiFile style={{ color: '#7c3aed' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Select Client</label>
                </div>
                <SearchableDropdown
                  options={clients}
                  value={formData.client}
                  onChange={(optionId) => {
                    handleChange({ target: { name: 'client', value: optionId } });
                  }}
                  placeholder="Search by client name..."
                  loading={loadingClients}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiHash style={{ color: '#7c3aed' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Invoice Number (Optional)</label>
                  <div style={{ flex: 1 }}></div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSeq = (formData.invoice_no && typeof formData.invoice_no === 'string') ? formData.invoice_no.split('/').pop() : "0001";
                      setResetModal({ open: true, value: currentSeq });
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 600
                    }}
                    title="Auto-generate next sequence"
                  >
                    <FiRefreshCcw size={12} /> Reset
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRight: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px 0 0 12px',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: 'Space Mono, monospace',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {(() => {
                      const d = new Date(formData.date);
                      const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                      return `INV/${y % 100}-${(y + 1) % 100}/`;
                    })()}
                  </div>
                  <input
                    type="text"
                    name="invoice_no_seq"
                    className="form-input"
                    style={{
                      borderRadius: '0 12px 12px 0',
                      fontFamily: 'Space Mono, monospace',
                      flex: 1,
                      width: 'auto',
                      margin: 0
                    }}
                    value={(formData.invoice_no && typeof formData.invoice_no === 'string') ? formData.invoice_no.split('/').pop() : ""}
                    onChange={(e) => {
                      const seq = e.target.value;
                      const d = new Date(formData.date);
                      const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                      const fyStr = `${y % 100}-${(y + 1) % 100}`;
                      setFormData(prev => ({
                        ...prev,
                        invoice_no: seq ? `INV/${fyStr}/${seq}` : ""
                      }));
                    }}
                    placeholder="e.g. 0001"
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  Type only the number part. Formatted as <b>
                    {(() => {
                      const d = new Date(formData.date);
                      const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                      return `INV/${y % 100}-${(y + 1) % 100}/XXXX`;
                    })()}
                  </b>
                </p>
              </div>

              <div className="form-field-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiCalendar style={{ color: '#7c3aed' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Invoice Date</label>
                </div>
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiClock style={{ color: '#ef4444' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Due Date</label>
                </div>
                <input
                  type="date"
                  name="due_date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiClock style={{ color: '#7c3aed' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Payment Terms</label>
                </div>
                <input
                  type="text"
                  name="payment_term"
                  className="form-input"
                  value={formData.payment_term}
                  onChange={handleChange}
                  placeholder="e.g. Net 15, Net 30, Due on Receipt"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FiMessageSquare style={{ color: '#7c3aed' }} />
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Remarks / Notes</label>
                </div>
                <textarea
                  name="remark"
                  className="form-input"
                  style={{ height: '100px', paddingTop: '16px' }}
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="Any special instructions or notes to include in the PDF..."
                />
              </div>
            </div>
          </div>

          <div className="wizard-footer">
            <button type="button" className="back-btn" onClick={onPrev}>
              Cancel
            </button>
            <button type="submit" className="next-button" style={{ position: 'static' }}>
              Next: Add Line Items
            </button>
          </div>
        </form>
      </div>

      {/* Reset Counter Modal */}
      {resetModal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '32px', width: '360px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Reset Sequence Counter</h3>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
                The next invoice will use this number. Future invoices will count up from here.
              </p>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Next sequence number</label>
              <input
                type="number"
                min="1"
                autoFocus
                value={resetModal.value}
                onChange={e => setResetModal(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newSeq = parseInt(resetModal.value, 10);
                    if (isNaN(newSeq) || newSeq < 1) return;
                    try {
                      const d = new Date(formData.date);
                      const fy = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                      const res = await resetInvoiceCounter(newSeq, String(fy));
                      const val = res.data?.invoice_no || "";
                      setFormData(prev => ({ ...prev, invoice_no: typeof val === 'string' ? val : "" }));
                    } catch (e) { logger.error("InvoiceDetailsForm", "reset failed", e); }
                    setResetModal({ open: false, value: "" });
                  }
                  if (e.key === 'Escape') setResetModal({ open: false, value: "" });
                }}
                style={{
                  width: '100%', padding: '12px 16px', border: '2px solid #7c3aed',
                  borderRadius: '12px', fontSize: '20px', fontFamily: 'Space Mono, monospace',
                  fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setResetModal({ open: false, value: "" })}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                }}
              >Cancel</button>
              <button
                onClick={async () => {
                  const newSeq = parseInt(resetModal.value, 10);
                  if (isNaN(newSeq) || newSeq < 1) return;
                  try {
                    const d = new Date(formData.date);
                    const fy = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                    const res = await resetInvoiceCounter(newSeq, String(fy));
                    const val = res.data?.invoice_no || "";
                    setFormData(prev => ({ ...prev, invoice_no: typeof val === 'string' ? val : "" }));
                  } catch (err) { logger.error("InvoiceDetailsForm", "reset failed", err); }
                  setResetModal({ open: false, value: "" });
                }}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                }}
              >Save Counter</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceDetailsForm;
