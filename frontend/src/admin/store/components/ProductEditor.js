import React, { useState } from 'react';

export default function ProductEditor({ 
  product, 
  onClose, 
  onSave, 
  saving 
}) {
  const parseSpecs = (specsInput) => {
    if (!specsInput) return [{ key: '', value: '' }];
    try {
      const parsed = typeof specsInput === 'string' ? JSON.parse(specsInput) : specsInput;
      const arr = Object.entries(parsed).map(([key, value]) => ({ key, value }));
      return arr.length > 0 ? arr : [{ key: '', value: '' }];
    } catch (e) {
      return [{ key: '', value: '' }];
    }
  };

  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || '',
    cost_price: product?.cost_price || '',
    stock_quantity: product?.stock_quantity || '',
    category: product?.category || '',
    stock_type: product?.stock_type || 'in_stock',
    outsource_days: product?.outsource_days || 0,
  });

  const [specs, setSpecs] = useState(parseSpecs(product?.technical_specs));
  const [mainImage, setMainImage] = useState(null);

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index) => {
    const updated = specs.filter((_, i) => i !== index);
    setSpecs(updated.length > 0 ? updated : [{ key: '', value: '' }]);
  };

  const handleSpecChange = (index, field, val) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach(k => {
      formData.append(k, form[k]);
    });
    
    // Assemble specs array into a single JSON object
    const specsObj = {};
    specs.forEach(s => {
      if (s.key.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });
    formData.append('technical_specs', JSON.stringify(specsObj));

    if (mainImage) formData.append('image', mainImage);
    await onSave(formData, product?.id);
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal__content">
        <div className="admin-modal__header">
          <h2 className="page-title">{product ? 'Edit Product' : 'New Product'}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <i className="fa-light fa-sharp fa-xmark" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input 
              className="form-input" 
              required 
              placeholder="e.g. ESP32 NodeMCU DevKit"
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
          </div>
          
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">SKU</label>
              <input 
                className="form-input" 
                required 
                placeholder="e.g. ESP32-NODE-V1"
                value={form.sku} 
                onChange={e => setForm({...form, sku: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <input 
                className="form-input" 
                required 
                placeholder="e.g. Microcontrollers"
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price (Rs.)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input" 
                required 
                placeholder="e.g. 850.00"
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Cost Price (Rs.)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input" 
                required 
                placeholder="e.g. 550.00"
                value={form.cost_price} 
                onChange={e => setForm({...form, cost_price: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Stock Qty</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                placeholder="e.g. 30"
                value={form.stock_quantity} 
                onChange={e => setForm({...form, stock_quantity: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Stock Type</label>
              <select className="form-select" value={form.stock_type} onChange={e => setForm({...form, stock_type: e.target.value})}>
                <option value="in_stock">In Stock</option>
                <option value="outsourced">Outsourced</option>
              </select>
            </div>
          </div>

          {form.stock_type === 'outsourced' && (
            <div className="form-group">
              <label className="form-label">Outsource Days</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                placeholder="e.g. 4"
                value={form.outsource_days} 
                onChange={e => setForm({...form, outsource_days: e.target.value})} 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea" 
              required 
              placeholder="Describe the product details, parameters, pinouts..."
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <span>Technical Specifications</span>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={handleAddSpecRow} 
                style={{ marginLeft: 'auto', padding: 'var(--space-1) var(--space-2)' }}
              >
                <i className="fa-light fa-sharp fa-plus" /> Add Spec Row
              </button>
            </label>
            <div className="specs-builder-rows" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input 
                    className="form-input" 
                    placeholder="Specification Name (e.g. Voltage)" 
                    value={spec.key} 
                    onChange={e => handleSpecChange(i, 'key', e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <input 
                    className="form-input" 
                    placeholder="Specification Value (e.g. 5V DC)" 
                    value={spec.value} 
                    onChange={e => handleSpecChange(i, 'value', e.target.value)} 
                    style={{ flex: 1.5 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleRemoveSpecRow(i)} 
                    style={{ padding: 'var(--space-2)' }}
                    title="Delete Specification Row"
                  >
                    <i className="fa-light fa-sharp fa-trash" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Main Image</label>
            <div className="drag-drop-zone">
              <input type="file" accept="image/*" onChange={e => setMainImage(e.target.files[0])} />
              <div className="drag-drop-content">
                <i className="fa-light fa-sharp fa-cloud-arrow-up text-2xl" />
                <p>{mainImage ? mainImage.name : 'Click or drag image here'}</p>
              </div>
            </div>
          </div>

          <div className="admin-modal__footer mt-6 flex justify-between">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-floppy-disk" />} 
              {saving ? ' Saving...' : ' Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

