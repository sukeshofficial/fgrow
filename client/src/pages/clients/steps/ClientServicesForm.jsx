import React, { useState, useEffect } from "react";
import FormField from "../../../components/ui/FormField";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listServicesByTenant } from "../../../api/service.api";
import { listBillingEntities, listStaff } from "../../../api/client.api";
import { FiCheck } from "react-icons/fi";
import { Spinner } from "../../../components/ui/Spinner";

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
            is_recurring: service.is_recurring || false,
            active: true,
            start_date: new Date().toISOString().split('T')[0],
            end_date: "" 
          }
        ],
        service_assignments: [
            ...prev.service_assignments,
            { service_id: service._id, custom_users: [] }
        ]
      }));
    }
  };

  const handleRecurringToggle = (serviceId, e) => {
    e.stopPropagation();
    setForm(prev => ({
        ...prev,
        recurring_services: prev.recurring_services.map(s => {
            const sId = s.service?._id || s.service;
            if (sId === serviceId) {
                return { ...s, is_recurring: !s.is_recurring };
            }
            return s;
        })
    }));
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  };

  const handleServiceDataChange = (serviceId, key, value) => {
    setForm(prev => ({
        ...prev,
        recurring_services: prev.recurring_services.map(s => {
            const sId = s.service?._id || s.service;
            if (sId === serviceId) {
                return { ...s, [key]: value };
            }
            return s;
        })
    }));
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

  if (loading) {
    return (
      <div className="step-placeholder" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="step-container">
      <h2 className="form-title">Recurring Services</h2>

      {/* Select Services Dropdown */}
      <div className="form-field" style={{ marginBottom: '32px' }}>
        <label className="form-label" style={{ fontWeight: '600', fontSize: '13px', letterSpacing: '0.5px' }}>SELECT SERVICES <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ maxWidth: '500px', marginTop: '12px' }}>
            <SearchableDropdown 
                options={availableServices.map(s => ({ _id: s._id, name: s.name }))}
                value={null} // Keep it empty for multiple selections
                onChange={(serviceId) => {
                    const fullService = availableServices.find(s => s._id === serviceId);
                    if (fullService) handleServiceToggle(fullService);
                }}
                placeholder="Search and select services..."
            />
        </div>

        {/* Selected Services List */}
        <div className="selected-services-list" style={{ 
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '480px',
            overflowY: 'auto',
            paddingRight: '8px'
        }}>
          {form.recurring_services.map(selectedService => {
            const serviceId = selectedService.service?._id || selectedService.service;
            const fullServiceInfo = availableServices.find(s => s._id === serviceId) || selectedService.service;
            
            return (
              <div 
                key={serviceId}
                className="selected-service-item"
                style={{
                    background: 'white',
                    border: '1.5px solid var(--primary-accent)',
                    padding: '20px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                    animation: 'slideIn 0.3s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            background: '#f5f3ff', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--primary-accent)',
                            fontWeight: 'bold'
                        }}>
                            {fullServiceInfo?.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{fullServiceInfo?.name}</span>
                    </div>
                    <button 
                        onClick={() => handleServiceToggle(fullServiceInfo)}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#ef4444', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: 'pointer',
                            padding: '4px 8px'
                        }}
                    >
                        Remove
                    </button>
                </div>

                <div 
                    style={{ 
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '24px',
                        alignItems: 'flex-end'
                    }}
                >
                    <div style={{ flex: '0 0 auto', minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.5px' }}>BILLING TYPE</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: selectedService.is_recurring ? 'var(--primary-accent)' : '#64748b' }}>
                                {selectedService.is_recurring ? 'Recurring' : 'One-time'}
                            </span>
                            <div 
                                className={`custom-toggle ${selectedService.is_recurring ? 'active' : ''}`}
                                onClick={(e) => handleRecurringToggle(serviceId, e)}
                                style={{
                                    width: '36px',
                                    height: '20px',
                                    background: selectedService.is_recurring ? 'var(--primary-accent)' : '#e2e8f0',
                                    borderRadius: '10px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: selectedService.is_recurring ? '19px' : '3px',
                                    transition: 'all 0.2s'
                                }} />
                            </div>
                        </div>
                    </div>
-
                    <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <div className="date-field" style={{ flex: '1', minWidth: '130px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                                {selectedService.is_recurring ? 'START DATE' : 'SERVICE DATE'}
                            </label>
                            <input 
                                type="date"
                                className="form-input"
                                value={formatDate(selectedService.start_date)}
                                onChange={(e) => handleServiceDataChange(serviceId, "start_date", e.target.value)}
                                style={{ height: '38px', width: '100%' }}
                            />
                        </div>
                        {selectedService.is_recurring && (
                            <div className="date-field" style={{ flex: '1', minWidth: '130px' }}>
                                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', display: 'block' }}>END DATE</label>
                                <input 
                                    type="date"
                                    className="form-input"
                                    value={formatDate(selectedService.end_date)}
                                    onChange={(e) => handleServiceDataChange(serviceId, "end_date", e.target.value)}
                                    style={{ height: '38px', width: '100%' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
        <div className="left-column" style={{ flex: '1.2', minWidth: '300px' }}>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ flex: '1', minWidth: '140px' }}>
                                <FormField label="Amount">
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={form.opening_balance.amount}
                                        onChange={(e) => handleOpeningBalanceChange("amount", Number(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </FormField>
                            </div>
                            <div style={{ flex: '1', minWidth: '180px' }}>
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
                    </div>
                )}
           </div>
        </div>

        <div className="right-column" style={{ flex: '1', minWidth: '300px' }}>
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

      <div className="wizard-footer">
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
