import React, { useState, useEffect } from "react";
import { getUnbilledTasks } from "../../../features/invoices/invoiceService";
import { FiTrash2, FiPlus, FiInfo, FiCheck } from "react-icons/fi";
import { Spinner } from "../../../components/ui/Spinner";
import { useModal } from "../../../context/ModalContext";
import logger from "../../../utils/logger.js";

const InvoiceItemsForm = ({ data, onNext, onPrev }) => {
  const { showAlert } = useModal();
  const [items, setItems] = useState(data.items || []);
  const [unbilledTasks, setUnbilledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    total_gst: 0,
    discount_total: 0,
    total_amount: 0
  });

  useEffect(() => {
    const fetchTasks = async () => {
      if (data.client) {
        try {
          setLoading(true);
          const response = await getUnbilledTasks(data.client);
          setUnbilledTasks(response.data || []);
        } catch (error) {
          logger.error("InvoiceItemsForm", "Failed to fetch unbilled tasks", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTasks();
  }, [data.client]);

  useEffect(() => {
    calculateTotals(items);
  }, [items]);

  const calculateTotals = (currentItems) => {
    let subtotal = 0; // Gross
    let total_gst = 0;
    let discount_total = 0;

    currentItems.forEach(it => {
      const qty = Number(it.quantity || 1);
      const unit = Number(it.unit_price || 0);
      const discount = Number(it.discount || 0);
      const gst_rate = Number(it.gst_rate || 0);

      const lineNet = qty * unit;
      const lineAfterDiscount = Math.max(0, lineNet - discount);
      const gstAmount = (lineAfterDiscount * gst_rate) / 100;

      subtotal += lineNet;
      total_gst += gstAmount;
      discount_total += discount;
    });

    const total_amount = (subtotal - discount_total) + total_gst;
    setTotals({ subtotal, total_gst, discount_total, total_amount });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(), // Unique temporary ID for React keys
        type: "manual",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        gst_rate: 18,
        total_amount: 0,
        meta: { sac: "", long_description: "" }
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const newItems = [...prev];
      const removedItem = newItems[index];
      if (removedItem.source_id) {
        setSelectedTaskIds(ids => ids.filter(id => id !== removedItem.source_id));
      }
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      const it = { ...newItems[index] }; // Copy the item object

      if (field === 'meta') {
        it.meta = { ...it.meta, ...value };
      } else {
        it[field] = value;
      }

      // Recalculate line total for display
      const qty = Number(it.quantity || 1);
      const unit = Number(it.unit_price || 0);
      const discount = Number(it.discount || 0);
      const gst_rate = Number(it.gst_rate || 0);
      const lineNet = qty * unit;
      const lineAfterDiscount = Math.max(0, lineNet - discount);
      const gstAmount = (lineAfterDiscount * gst_rate) / 100;
      it.total_amount = lineAfterDiscount + gstAmount;

      newItems[index] = it;
      return newItems;
    });
  };

  const toggleTask = (task) => {
    // 1. Check if already selected
    const isSelected = selectedTaskIds.includes(task._id);

    if (isSelected) {
      // REMOVE
      setSelectedTaskIds(prev => prev.filter(id => id !== task._id));
      setItems(prev => prev.filter(it => it.source_id !== task._id));
    } else {
      // ADD
      setSelectedTaskIds(prev => [...prev, task._id]);
      setItems(prev => [
        ...prev,
        {
          tempId: task._id.toString(), // Use task ID as tempId for stable keys
          type: task.type || "task",
          description: task.title || task.name,
          quantity: 1,
          unit_price: task.estimated_price || 0,
          discount: 0,
          gst_rate: 18,
          source_id: task._id.toString(),
          total_amount: task.estimated_price || 0,
          meta: { long_description: task.description || "" }
        }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (items.length === 0) {
      await showAlert("Empty Invoice", "Please add at least one item to the invoice.", "warning");
      return;
    }

    // SANITIZE: Ensure source_id is a string or null (not an object)
    const sanitizedItems = items.map(it => ({
      ...it,
      source_id: (it.source_id && typeof it.source_id === 'object')
        ? it.source_id.toString()
        : (it.source_id || null)
    }));

    onNext({ items: sanitizedItems, ...totals });
  };

  return (
    <div className="step-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="form-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Line Items</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Manage the services and tasks being billed in this invoice.</p>
      </div>

      {unbilledTasks.length > 0 && (
        <div className="unbilled-tasks-section">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiInfo style={{ color: '#7c3aed' }} /> Import Unbilled Tasks
          </h3>
          <div className="task-pills-container">
            {unbilledTasks.map(task => (
              <div
                key={task._id}
                className={`task-pill ${selectedTaskIds.includes(task._id) ? 'selected' : ''}`}
                onClick={() => toggleTask(task)}
              >
                {selectedTaskIds.includes(task._id) && <FiCheck size={14} />}
                {task.title || task.name}
                <span style={{ marginLeft: '4px', opacity: 0.7 }}>₹{task.estimated_price || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="items-container">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={item._id || item.tempId || index} className="item-row-card">
              <button
                type="button"
                className="item-remove-btn"
                onClick={() => handleRemoveItem(index)}
                title="Remove Item"
              >
                <FiTrash2 size={14} />
              </button>

              <div className="item-row-grid">
                <div className="item-input-group" style={{ gridColumn: '1 / span 5' }}>
                  <label className="item-label">Particulars</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter item name or service title..."
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    style={{ fontWeight: 600, fontSize: '15px' }}
                  />
                </div>

                <div className="item-input-group" style={{ gridColumn: '1 / span 5' }}>
                  <textarea
                    className="form-input"
                    placeholder="Additional details (optional)..."
                    value={item.meta?.long_description}
                    onChange={(e) => handleItemChange(index, 'meta', { long_description: e.target.value })}
                    style={{ height: '60px', fontSize: '13px', paddingTop: '10px' }}
                  />
                </div>

                <div className="item-input-group">
                  <label className="item-label">Unit Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  />
                </div>

                <div className="item-input-group">
                  <label className="item-label">QTY</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.quantity || 1}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>

                <div className="item-input-group">
                  <label className="item-label">Discount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                  />
                </div>

                <div className="item-input-group">
                  <label className="item-label">GST (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.gst_rate}
                    onChange={(e) => handleItemChange(index, 'gst_rate', e.target.value)}
                  />
                </div>

                <div className="item-input-group">
                  <label className="item-label">Total Amount</label>
                  <div style={{
                    height: '42px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    fontWeight: 700,
                    color: '#1e293b',
                    border: '1px solid #e2e8f0'
                  }}>
                    ₹{(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '16px' }}>No items added yet.</div>
            <button type="button" className="add-item-btn-premium" onClick={handleAddItem}>
              <FiPlus /> Add Manual Item
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="add-item-area">
            <button type="button" className="add-item-btn-premium" onClick={handleAddItem}>
              <FiPlus /> Add More Items
            </button>
          </div>
        )}
      </div>

      <div className="invoice-summary-card">
        <h3 className="summary-title">Summary</h3>
        <div className="summary-row">
          <span>Subtotal (Net Amount)</span>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="summary-row">
          <span>Total GST</span>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{totals.total_gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        {totals.discount_total > 0 && (
          <div className="summary-row">
            <span>Total Discount</span>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>-₹{totals.discount_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Grand Total</span>
          <span className="grand-total-value">₹{totals.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="wizard-footer" style={{ marginTop: '40px' }}>
        <button type="button" className="back-btn" onClick={onPrev}>
          Back
        </button>
        <button type="submit" className="next-button" style={{ position: 'static' }} onClick={handleSubmit}>
          Save & Review
        </button>
      </div>
    </div>
  );
};

export default InvoiceItemsForm;
