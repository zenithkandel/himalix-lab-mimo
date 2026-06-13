import React, { useState, useEffect } from 'react';

export default function ProductEditor({ 
  product, 
  onClose, 
  onSave, 
  saving,
  authFetch
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

  const parseImageUrls = (urlsInput) => {
    if (!urlsInput) return [];
    try {
      return typeof urlsInput === 'string' ? JSON.parse(urlsInput) : urlsInput;
    } catch (e) {
      return [];
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
  const [imageUrls, setImageUrls] = useState(parseImageUrls(product?.image_urls || (product?.image_url ? [product.image_url] : [])));
  const [mainImageUrl, setMainImageUrl] = useState(product?.image_url || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) return;
    
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    try {
      const res = await authFetch('/api/store/admin/upload-multiple', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      const newUrls = data.imageUrls || [];
      const updatedList = [...imageUrls, ...newUrls];
      setImageUrls(updatedList);
      
      if (!mainImageUrl && updatedList.length > 0) {
        setMainImageUrl(updatedList[0]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      handlePaste(e);
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [imageUrls, mainImageUrl]);

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

  const handleMultipleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));

    try {
      const res = await authFetch('/api/store/admin/upload-multiple', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      const newUrls = data.imageUrls || [];
      const updatedList = [...imageUrls, ...newUrls];
      setImageUrls(updatedList);
      
      if (!mainImageUrl && updatedList.length > 0) {
        setMainImageUrl(updatedList[0]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetMainImage = (url) => {
    setMainImageUrl(url);
  };

  const handleRemoveImage = (url) => {
    const updated = imageUrls.filter(u => u !== url);
    setImageUrls(updated);
    if (mainImageUrl === url) {
      setMainImageUrl(updated.length > 0 ? updated[0] : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const specsObj = {};
    specs.forEach(s => {
      if (s.key.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });

    const productData = {
      ...form,
      price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      outsource_days: parseInt(form.outsource_days, 10) || 0,
      technical_specs: specsObj,
      image_url: mainImageUrl,
      image_urls: imageUrls,
    };

    await onSave(productData, product?.id);
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal">
        <div className="admin-modal__content">
          <div className="admin-modal__header">
            <h2 className="page-title">{product ? 'Edit Product' : 'New Product'}</h2>
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close dialog">
              <i className="fa-light fa-sharp fa-xmark" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-modal__body">
            <div className="form-group">
              <label className="form-label">
                Product Name{' '}
                <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Enter the public name of the product, e.g. Arduino Uno R3" />
              </label>
              <input 
                className="form-input" 
                required 
                placeholder="Enter product title, e.g. Arduino Uno R3"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>
            
            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  SKU{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Stock Keeping Unit: a unique identifier code for cataloging" />
                </label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="Unique ID, e.g. ARD-UNO-R3"
                  value={form.sku} 
                  onChange={e => setForm({...form, sku: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Category{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Organize the product into a catalog group, e.g. Microcontrollers, Sensors" />
                </label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="e.g. Microcontrollers, Sensors"
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Price (Rs.){' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Set the public retail selling price of the item" />
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  required 
                  placeholder="Sales price, e.g. 650.00"
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Cost Price (Rs.){' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Purchase cost of the item used for internal margin calculation" />
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  required 
                  placeholder="Purchase cost, e.g. 420.00"
                  value={form.cost_price} 
                  onChange={e => setForm({...form, cost_price: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Stock Qty{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Current physical inventory quantity available for immediate sale" />
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  placeholder="Initial inventory, e.g. 50"
                  value={form.stock_quantity} 
                  onChange={e => setForm({...form, stock_quantity: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Stock Type{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="In Stock means items are in inventory; Outsourced means items are ordered from suppliers on-demand" />
                </label>
                <select className="form-select" value={form.stock_type} onChange={e => setForm({...form, stock_type: e.target.value})}>
                  <option value="in_stock">In Stock</option>
                  <option value="outsourced">Outsourced</option>
                </select>
              </div>
            </div>

            {form.stock_type === 'outsourced' && (
              <div className="form-group">
                <label className="form-label">
                  Outsource Days{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Number of days required to procure/manufacture the outsourced product" />
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  placeholder="Fulfillment days, e.g. 5"
                  value={form.outsource_days} 
                  onChange={e => setForm({...form, outsource_days: e.target.value})} 
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Description{' '}
                <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Detailed product description, specifications, usage instructions, or documentation links" />
              </label>
              <textarea 
                className="form-textarea" 
                required 
                placeholder="Write description pinouts, specifications and documentation link here..."
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <span>
                  Technical Specifications{' '}
                  <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Key-value specifications table to display in product details (e.g., Operating Voltage: 5V)" />
                </span>
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
                      placeholder="Specification Key (e.g. Voltage, RAM)" 
                      value={spec.key} 
                      onChange={e => handleSpecChange(i, 'key', e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <input 
                      className="form-input" 
                      placeholder="Specification Value (e.g. 5V, 512 MB)" 
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
              <label className="form-label">
                Product Images{' '}
                <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Upload product pictures. The first image selected will serve as the cover image. Click any uploaded image to select it as the Main cover image." />
              </label>
              <div className="drag-drop-zone" style={{ marginBottom: 'var(--space-4)' }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleMultipleImagesUpload} 
                  disabled={uploading}
                />
                <div className="drag-drop-content">
                  <i className="fa-light fa-sharp fa-cloud-arrow-up text-2xl" />
                  <p>{uploading ? 'Uploading images...' : 'Click or drag multiple files here'}</p>
                </div>
              </div>

              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-4" style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', border: '1px solid var(--border)' }}>
                  {imageUrls.map((url, idx) => {
                    const isMain = url === mainImageUrl;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          position: 'relative', 
                          width: 80, 
                          height: 80, 
                          border: isMain ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: 'var(--bg-0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSetMainImage(url)}
                        title="Click to set as main image"
                      >
                        <img 
                          src={`http://localhost:5000${url}`} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={e => { e.target.src = '/placeholder.png'; }}
                        />
                        {isMain && (
                          <span style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            background: 'var(--accent)', 
                            color: 'var(--bg-0)', 
                            fontSize: '8px', 
                            fontWeight: 700, 
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(url); }}
                          style={{ 
                            position: 'absolute', 
                            top: -6, 
                            right: -6, 
                            background: 'var(--danger)', 
                            color: '#ffffff', 
                            border: 'none', 
                            borderRadius: '50%', 
                            width: 18, 
                            height: 18, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '10px',
                            padding: 0
                          }}
                          title="Remove Image"
                        >
                          <i className="fa-light fa-sharp fa-xmark" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="admin-modal__footer mt-6 flex justify-between">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                {saving ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-floppy-disk" />} 
                {saving ? ' Saving...' : ' Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

