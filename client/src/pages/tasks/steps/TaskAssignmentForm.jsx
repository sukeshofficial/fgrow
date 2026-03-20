import React, { useState, useEffect } from "react";
import { listClients, listStaff } from "../../../api/client.api";
import { listServices } from "../../../api/service.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";

const TaskAssignmentForm = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState({
    client: data.client || "",
    service: data.service || "",
    users: data.users || [],
  });

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResp, servicesResp, staffResp] = await Promise.all([
          listClients({ limit: 100 }),
          listServices({ limit: 100 }),
          listStaff(),
        ]);
        
        setClients(clientsResp.data.data);
        setServices(servicesResp.data.data);
        setStaff(staffResp.data.data);
      } catch (err) {
        console.error("Failed to load assignment options", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserToggle = (userId) => {
    setFormData((prev) => {
      const users = prev.users.includes(userId)
        ? prev.users.filter((id) => id !== userId)
        : [...prev.users, userId];
      return { ...prev, users };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <h2 className="form-title">Links & Assignment</h2>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Client</label>
          <SearchableDropdown
            options={clients}
            value={formData.client}
            onChange={(val) => setFormData(prev => ({ ...prev, client: val }))}
            placeholder="Select Client"
            loading={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Service</label>
          <SearchableDropdown
            options={services}
            value={formData.service}
            onChange={(val) => setFormData(prev => ({ ...prev, service: val }))}
            placeholder="Select Service"
            loading={loading}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Assign Staff</label>
        <SearchableDropdown
          options={staff}
          value={formData.users}
          onChange={(newUsers) => setFormData(prev => ({ ...prev, users: newUsers }))}
          isMulti={true}
          placeholder="Select staff members..."
          loading={loading}
        />
      </div>

      <div className="wizard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
        <button type="button" className="back-btn" onClick={onPrev}>Back</button>
        <button type="submit" className="next-button" style={{ position: 'static', margin: 0 }}>
          Next: Review & Create
        </button>
      </div>
    </form>
  );
};

export default TaskAssignmentForm;
