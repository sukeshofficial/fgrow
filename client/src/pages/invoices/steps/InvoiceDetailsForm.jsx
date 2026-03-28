import React, { useState, useEffect } from "react";
import FormField from "../../../components/ui/FormField";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listClients } from "../../../api/client.api";
import { FiFile, FiCalendar, FiClock, FiMessageSquare, FiHash } from "react-icons/fi";

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

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await listClients({ is_active: true, limit: 100 });
        setClients(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
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
      const oldYear = new Date(formData.date).getFullYear();
      const newYear = new Date(value).getFullYear();
      if (oldYear !== newYear && formData.invoice_no.startsWith(`INV-${oldYear}-`)) {
        const seq = formData.invoice_no.split('-').pop();
        updates.invoice_no = `INV-${newYear}-${seq}`;
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
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
                  INV-{new Date(formData.date).getFullYear()}-
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
                  value={formData.invoice_no ? formData.invoice_no.split('-').pop() : ""}
                  onChange={(e) => {
                    const seq = e.target.value;
                    const year = new Date(formData.date).getFullYear();
                    setFormData(prev => ({
                      ...prev,
                      invoice_no: seq ? `INV-${year}-${seq}` : ""
                    }));
                  }}
                  placeholder="e.g. 0001"
                />
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                Type only the number part. Formatted as <b>INV-{new Date(formData.date).getFullYear()}-XXXX</b>
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
  );
};

export default InvoiceDetailsForm;
