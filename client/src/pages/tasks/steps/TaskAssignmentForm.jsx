import React, { useState, useEffect } from "react";
import { listClients, listStaff } from "../../../api/client.api";
import { listServices } from "../../../api/service.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { FaLink, FaArrowRight, FaArrowLeft } from "react-icons/fa";

const TaskAssignmentForm = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState({
    client: data.client || "",
    service: data.service || "",
    users: data.users || [],
  });

  // Full resolved objects for the review step
  const [clientObj, setClientObj] = useState(data._clientObj || null);
  const [serviceObj, setServiceObj] = useState(data._serviceObj || null);
  const [userObjects, setUserObjects] = useState(data._userObjects || []);

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

        const clientList = clientsResp.data.data;
        const serviceList = servicesResp.data.data;
        const staffList = staffResp.data.data;

        setClients(clientList);
        setServices(serviceList);
        setStaff(staffList);

        // Resolve initial IDs → objects (for EditWizard pre-population)
        if (data.client && !data._clientObj) {
          setClientObj(clientList.find(c => c._id === data.client) || null);
        }
        if (data.service && !data._serviceObj) {
          setServiceObj(serviceList.find(s => s._id === data.service) || null);
        }
        if (data.users?.length && !data._userObjects?.length) {
          setUserObjects(staffList.filter(u => data.users.includes(u._id)));
        }
      } catch (err) {
        console.error("Failed to load assignment options", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClientChange = (val) => {
    setFormData(prev => ({ ...prev, client: val }));
    setClientObj(clients.find(c => c._id === val) || null);
  };

  const handleServiceChange = (val) => {
    setFormData(prev => ({ ...prev, service: val }));
    setServiceObj(services.find(s => s._id === val) || null);
  };

  const handleUsersChange = (newUserIds) => {
    setFormData(prev => ({ ...prev, users: newUserIds }));
    setUserObjects(staff.filter(u => newUserIds.includes(u._id)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({
      ...formData,
      _clientObj: clientObj,
      _serviceObj: serviceObj,
      _userObjects: userObjects,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <h2 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: 'var(--primary-accent)', fontSize: '22px', display: 'flex' }}><FaLink /></span>
        Links & Assignment
      </h2>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Client</label>
          <SearchableDropdown
            options={clients}
            value={formData.client}
            onChange={handleClientChange}
            placeholder="Select Client"
            loading={loading}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Service</label>
          <SearchableDropdown
            options={services}
            value={formData.service}
            onChange={handleServiceChange}
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
          onChange={handleUsersChange}
          isMulti={true}
          placeholder="Select staff members..."
          loading={loading}
        />
      </div>

      <div className="wizard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
        <button type="button" className="back-btn" onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaArrowLeft size={12} /> Back
        </button>
        <button type="submit" className="next-button" style={{ position: 'static', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Next: Review <FaArrowRight size={12} />
        </button>
      </div>
    </form>
  );
};

export default TaskAssignmentForm;
