import React, { useState } from 'react';

export default function ProductEditor({ 
  product, 
  onClose, 
  onSave, 
  saving 
}) {
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
    technical_specs: product?.technical_specs ? JSON.stringify(product.technical_specs, null, 2) : '{}'
  });

  const [mainImage, setMainImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach(k => {
      formData.append(k, form[k]);
    });
    if (mainImage) formData.append('image', mainImage);
    await onSave(formData, product?.id);
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal__content">
        <div className="admin-modal__header">
          <h2 className="page-title">{product ? 'Edit Product' : 'New Product'}</h2>
          <button className="btn btn-ghost" onClick={onClose}><i className="fa-light fa-sharp fa-xmark" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          
          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">SKU</label>
              <input className="form-input" required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <input className="form-input" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price</label>
              <input type="number" step="0.01" className="form-input" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Cost Price</label>
              <input type="number" step="0.01" className="form-input" required value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Stock Qty</label>
              <input type="number" className="form-input" required value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Stock Type</label>
              <select className="form-select" value={form.stock_type} onChange={e => setForm({...form, stock_type: e.target.value})}>
                <option value="in_stock">In Stock</option>
                <option value="outsourced">Outsourced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Technical Specs (JSON Key-Value Pairs)</label>
            <textarea 
              className="form-textarea font-mono" 
              placeholder='{"Voltage": "5V", "Current": "1A"}'
              value={form.technical_specs} 
              onChange={e => setForm({...form, technical_specs: e.target.value})} 
            />
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
