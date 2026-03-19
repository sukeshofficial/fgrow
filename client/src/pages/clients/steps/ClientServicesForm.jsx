import React, { useState, useEffect } from "react";
import FormField from "../../../components/ui/FormField";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listServicesByTenant } from "../../../api/service.api";
import { listBillingEntities, listStaff } from "../../../api/client.api";
import { FiCheck } from "react-icons/fi";

const ClientServicesForm = ({ data, onNext, onPrev, isEdit }) => {
  const [form, setForm] = useState({
    recurring_services: data.recurring_services || [],
    service_assignments: data.service_assignments || [],
    billing_profile: data.billing_profile || null,
    opening_balance: data.opening_balance || {
        enabled: false,
        amount: 0,
        type: "debit",
        as_of: new Date().toISOString().split('T')[0],
        currency: "INR",
        pay_mode: "Debit"
    }
  });

  const [availableServices, setAvailableServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [billingEntities, setBillingEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResp, staffResp, billingResp] = await Promise.all([
          listServicesByTenant(),
          listStaff(),
          listBillingEntities()
        ]);
        setAvailableServices(servicesResp.data.data);
        setStaff(staffResp.data.data.map(u => ({ _id: u._id, name: u.name || u.username })));
        
        // Add "Current Tenant" as the first option
        const entities = billingResp.data.data || [];
        setBillingEntities([
            { _id: null, name: 'Default (Current Tenant)' },
            ...entities
        ]);
      } catch (e) {
        console.error("Failed to fetch services/staff", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleServiceToggle = (service) => {
    const isSelected = form.recurring_services.some(s => (s.service?._id || s.service) === service._id);
    
    if (isSelected) {
      // Remove
      setForm(prev => ({
        ...prev,
        recurring_services: prev.recurring_services.filter(s => (s.service?._id || s.service) !== service._id),
        service_assignments: prev.service_assignments.filter(a => a.service_id !== service._id)
      }));
    } else {
      // Add
      setForm(prev => ({
        ...prev,
        recurring_services: [
          ...prev.recurring_services, 
          { 
            service: service._id, 
            sac_code: service.sac_code, 
            gst_rate: service.gst_rate, 
            default_billing_rate: service.default_billing_rate,
            active: true 
          }
        ],
        service_assignments: [
            ...prev.service_assignments,
            { service_id: service._id, custom_users: [] }
        ]
      }));
    }
  };

  const handleAssignmentChange = (users) => {
    setForm(prev => ({
        ...prev,
        service_assignments: prev.service_assignments.map(a => ({
            ...a,
            custom_users: users
        }))
    }));
  };

  const handleOpeningBalanceChange = (key, value) => {
    setForm(prev => ({
        ...prev,
        opening_balance: { ...prev.opening_balance, [key]: value }
    }));
  };

  const handleSubmit = () => {
    onNext(form);
  };

  if (loading) return <div className="step-placeholder">Loading resources...</div>;

  return (
    <div className="step-container">
      <h2 className="form-title">Recurring Services</h2>

      {/* Select Services Grid */}
      <div className="form-field">
        <label className="form-label">Select Services <span className="required-star">*</span></label>
        <div className="services-selection-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '16px', 
            background: 'var(--bg-light)', 
            padding: '24px', 
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            marginBottom: '32px'
        }}>
          {availableServices.map(service => {
            const isSelected = form.recurring_services.some(s => (s.service?._id || s.service) === service._id);
            return (
              <div 
                key={service._id}
                className={`service-selection-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleServiceToggle(service)}
                style={{
                    background: 'white',
                    border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                  {service.name}
                </div>
                {isSelected && (
                    <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        background: 'var(--primary-accent)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                    }}>
                        <FiCheck />
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '40px' }}>
        <div className="left-column" style={{ minWidth: 0 }}>
           <FormField label="Billing Profile" required>
            <SearchableDropdown 
                options={billingEntities}
                value={form.billing_profile}
                onChange={(val) => setForm(prev => ({ ...prev, billing_profile: val }))}
                placeholder="Select billing profile"
            />
           </FormField>

           <div className="opening-balance-section" style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <label className="form-label">Opening Balance</label>
                <div 
                    className={`custom-toggle ${form.opening_balance.enabled ? 'active' : ''}`}
                    onClick={() => handleOpeningBalanceChange("enabled", !form.opening_balance.enabled)}
                    style={{
                        width: '44px',
                        height: '24px',
                        background: form.opening_balance.enabled ? 'var(--primary-accent)' : '#e2e8f0',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{
                        width: '18px',
                        height: '18px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '3px',
                        left: form.opening_balance.enabled ? '23px' : '3px',
                        transition: 'all 0.2s'
                    }} />
                </div>
              </div>

                {form.opening_balance.enabled && (
                    <div className="opening-balance-card" style={{ 
                        padding: '24px', 
                        background: '#ffffff', 
                        border: '1.5px solid var(--primary-accent)', 
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <FormField label="Amount">
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={form.opening_balance.amount}
                                    onChange={(e) => handleOpeningBalanceChange("amount", Number(e.target.value))}
                                    placeholder="0.00"
                                />
                            </FormField>
                            <FormField label="Balance As on">
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    value={form.opening_balance.as_of ? form.opening_balance.as_of.split('T')[0] : ""}
                                    onChange={(e) => handleOpeningBalanceChange("as_of", e.target.value)}
                                />
                            </FormField>
                        </div>
                    </div>
                )}
           </div>
        </div>

        <div className="right-column" style={{ minWidth: 0 }}>
            <FormField label="Users" required>
                <SearchableDropdown 
                    isMulti
                    options={staff}
                    value={form.service_assignments[0]?.custom_users || []}
                    onChange={handleAssignmentChange}
                    placeholder="Search users"
                />
            </FormField>

            <div style={{ marginTop: '32px' }}>
                <FormField label="Pay Mode">
                    <select 
                        className="form-input"
                        value={form.opening_balance.pay_mode || 'Debit'}
                        onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({
                                ...prev,
                                opening_balance: {
                                    ...prev.opening_balance,
                                    pay_mode: val,
                                    type: val === 'Debit' ? 'debit' : 'credit'
                                }
                            }));
                        }}
                    >
                        <option value="Debit">Debit</option>
                        <option value="Credit card">Credit card</option>
                        <option value="Cash">Cash</option>
                        <option value="Net Banking">Net Banking</option>
                    </select>
                </FormField>
            </div>
        </div>
      </div>

      <div className="wizard-footer" style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <button type="button" className="back-btn" onClick={onPrev}>
          Back
        </button>
        <button type="button" className="next-button" style={{ position: 'static' }} onClick={handleSubmit}>
          {isEdit ? "Update Client" : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default ClientServicesForm;
