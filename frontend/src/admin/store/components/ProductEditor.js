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

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

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

  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!form.name.trim()) newErrors.name = 'Product name is required';
      if (!form.sku.trim()) newErrors.sku = 'SKU is required';
      if (!form.category.trim()) newErrors.category = 'Category is required';
      if (!form.description.trim()) newErrors.description = 'Description is required';
    } else if (s === 2) {
      if (form.cost_price === '' || isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0) {
        newErrors.cost_price = 'Cost price must be a valid positive number';
      }
      if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) {
        newErrors.price = 'Selling price must be a valid positive number';
      }
      if (form.stock_type === 'in_stock') {
        if (form.stock_quantity === '' || isNaN(Number(form.stock_quantity)) || Number(form.stock_quantity) < 0) {
          newErrors.stock_quantity = 'Stock quantity must be a valid positive number';
        }
      } else if (form.stock_type === 'outsourced') {
        if (form.outsource_days === '' || isNaN(Number(form.outsource_days)) || Number(form.outsource_days) < 0) {
          newErrors.outsource_days = 'Outsource procurement days must be a valid positive number';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleStepClick = (targetStep) => {
    if (!!product || targetStep < step) {
      setStep(targetStep);
      setErrors({});
    } else if (targetStep > step) {
      let currentVal = step;
      while (currentVal < targetStep) {
        if (!validateStep(currentVal)) {
          return;
        }
        currentVal++;
      }
      setStep(targetStep);
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation of all preceding steps
    if (!validateStep(1)) { setStep(1); return; }
    if (!validateStep(2)) { setStep(2); return; }

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

  const stepsConfig = [
    { label: 'Info', icon: 'info' },
    { label: 'Pricing & Stock', icon: 'tag' },
    { label: 'Specs', icon: 'list-check' },
    { label: 'Images', icon: 'images' },
    { label: 'Verify', icon: 'check-double' },
  ];

  /* Step Content Renderers */
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="form-group">
        <label className="form-label">
          Product Name <span style={{ color: 'var(--danger)' }}>*</span>
          <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Enter the public name of the product" />
        </label>
        <input 
          className="form-input" 
          placeholder="Enter product title, e.g. Arduino Uno R3"
          value={form.name} 
          onChange={e => {
            setForm({...form, name: e.target.value});
            if (errors.name) setErrors({...errors, name: ''});
          }}
          style={{ borderColor: errors.name ? 'var(--danger)' : '' }}
        />
        {errors.name && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.name}</span>}
      </div>

      <div className="flex gap-4">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">
            SKU <span style={{ color: 'var(--danger)' }}>*</span>
            <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Stock Keeping Unit (Unique Identifier)" />
          </label>
          <input 
            className="form-input" 
            placeholder="e.g. ARD-UNO-R3"
            value={form.sku} 
            onChange={e => {
              setForm({...form, sku: e.target.value});
              if (errors.sku) setErrors({...errors, sku: ''});
            }}
            style={{ borderColor: errors.sku ? 'var(--danger)' : '' }}
          />
          {errors.sku && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.sku}</span>}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">
            Category <span style={{ color: 'var(--danger)' }}>*</span>
            <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Catalog group" />
          </label>
          <input 
            className="form-input" 
            placeholder="e.g. Microcontrollers, Sensors"
            value={form.category} 
            onChange={e => {
              setForm({...form, category: e.target.value});
              if (errors.category) setErrors({...errors, category: ''});
            }}
            style={{ borderColor: errors.category ? 'var(--danger)' : '' }}
          />
          {errors.category && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.category}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Description <span style={{ color: 'var(--danger)' }}>*</span>
          <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Detailed description and usage instructions" />
        </label>
        <textarea 
          className="form-textarea" 
          placeholder="Write description pinouts, specifications and documentation link here..."
          value={form.description} 
          onChange={e => {
            setForm({...form, description: e.target.value});
            if (errors.description) setErrors({...errors, description: ''});
          }}
          style={{ minHeight: '120px', borderColor: errors.description ? 'var(--danger)' : '' }}
        />
        {errors.description && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.description}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const sellingPrice = parseFloat(form.price) || 0;
    const costPrice = parseFloat(form.cost_price) || 0;
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const markup = costPrice > 0 ? (profit / costPrice) * 100 : 0;

    let marginBadgeClass = 'margin-badge--negative';
    let marginBadgeLabel = 'Negative';
    if (margin >= 20) {
      marginBadgeClass = 'margin-badge--good';
      marginBadgeLabel = 'Healthy';
    } else if (margin >= 0) {
      marginBadgeClass = 'margin-badge--low';
      marginBadgeLabel = 'Low Margin';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="flex gap-4">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">
              Cost Price (Rs.) <span style={{ color: 'var(--danger)' }}>*</span>
              <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Purchase cost of the item" />
            </label>
            <input 
              type="number" 
              step="0.01" 
              className="form-input" 
              placeholder="e.g. 420.00"
              value={form.cost_price} 
              onChange={e => {
                setForm({...form, cost_price: e.target.value});
                if (errors.cost_price) setErrors({...errors, cost_price: ''});
              }}
              style={{ borderColor: errors.cost_price ? 'var(--danger)' : '' }}
            />
            {errors.cost_price && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.cost_price}</span>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">
              Selling Price (Rs.) <span style={{ color: 'var(--danger)' }}>*</span>
              <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Public retail sales price" />
            </label>
            <input 
              type="number" 
              step="0.01" 
              className="form-input" 
              placeholder="e.g. 650.00"
              value={form.price} 
              onChange={e => {
                setForm({...form, price: e.target.value});
                if (errors.price) setErrors({...errors, price: ''});
              }}
              style={{ borderColor: errors.price ? 'var(--danger)' : '' }}
            />
            {errors.price && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.price}</span>}
          </div>
        </div>

        {/* Live Margin Calculator */}
        <div className="pricing-calculator-bar">
          <div className="calculator-metric">
            <span className="calculator-metric__label">Gross Profit</span>
            <span className="calculator-metric__value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              Rs. {profit.toFixed(2)}
            </span>
          </div>
          <div className="calculator-metric">
            <span className="calculator-metric__label">Profit Margin</span>
            <span className="calculator-metric__value">
              {margin.toFixed(2)}%
              <span className={`margin-badge ${marginBadgeClass}`}>{marginBadgeLabel}</span>
            </span>
          </div>
          <div className="calculator-metric">
            <span className="calculator-metric__label">Markup</span>
            <span className="calculator-metric__value">
              {markup.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Choice cards for stock type */}
        <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
          <label className="form-label">
            Stock Type <span style={{ color: 'var(--danger)' }}>*</span>
            <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="In stock inventory or outsourced on demand" />
          </label>
          <div className="choice-card-grid">
            <div 
              className={`choice-card ${form.stock_type === 'in_stock' ? 'choice-card--active' : ''}`}
              onClick={() => {
                setForm({...form, stock_type: 'in_stock'});
                setErrors(prev => ({...prev, stock_quantity: '', outsource_days: ''}));
              }}
            >
              <span className="choice-card-title">
                <i className="fa-light fa-sharp fa-boxes-stacked" /> In Stock
              </span>
              <span className="choice-card-desc">
                Inventory is physically present and managed in-house for immediate dispatch.
              </span>
              <div className="choice-card__indicator" />
            </div>
            
            <div 
              className={`choice-card ${form.stock_type === 'outsourced' ? 'choice-card--active' : ''}`}
              onClick={() => {
                setForm({...form, stock_type: 'outsourced'});
                setErrors(prev => ({...prev, stock_quantity: '', outsource_days: ''}));
              }}
            >
              <span className="choice-card-title">
                <i className="fa-light fa-sharp fa-truck-ramp-box" /> Outsourced
              </span>
              <span className="choice-card-desc">
                Items are procured, manufactured, or shipped from a third-party supplier on-demand.
              </span>
              <div className="choice-card__indicator" />
            </div>
          </div>
        </div>

        {/* Dynamic Quantity or procurement days */}
        {form.stock_type === 'in_stock' ? (
          <div className="form-group">
            <label className="form-label">
              Stock Quantity <span style={{ color: 'var(--danger)' }}>*</span>
              <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Current physical units available" />
            </label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 50"
              value={form.stock_quantity} 
              onChange={e => {
                setForm({...form, stock_quantity: e.target.value});
                if (errors.stock_quantity) setErrors({...errors, stock_quantity: ''});
              }}
              style={{ borderColor: errors.stock_quantity ? 'var(--danger)' : '' }}
            />
            {errors.stock_quantity && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.stock_quantity}</span>}
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">
              Outsource Procurement Days <span style={{ color: 'var(--danger)' }}>*</span>
              <i className="fa-light fa-sharp fa-circle-info" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.7 }} title="Approximate days to receive stock" />
            </label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Fulfillment days, e.g. 5"
              value={form.outsource_days} 
              onChange={e => {
                setForm({...form, outsource_days: e.target.value});
                if (errors.outsource_days) setErrors({...errors, outsource_days: ''});
              }}
              style={{ borderColor: errors.outsource_days ? 'var(--danger)' : '' }}
            />
            {errors.outsource_days && <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{errors.outsource_days}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>Technical Specifications</h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Provide key parameters for the product detail page list.</p>
        </div>
        <button 
          type="button" 
          className="btn btn-ghost btn-sm" 
          onClick={handleAddSpecRow} 
          style={{ padding: 'var(--space-1) var(--space-2)' }}
        >
          <i className="fa-light fa-sharp fa-plus" /> Add Row
        </button>
      </div>

      <div className="specs-builder-rows" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        {specs.map((spec, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input 
              className="form-input" 
              placeholder="Specification Key (e.g. Operating Voltage, RAM)" 
              value={spec.key} 
              onChange={e => handleSpecChange(i, 'key', e.target.value)} 
              style={{ flex: 1 }}
            />
            <input 
              className="form-input" 
              placeholder="Specification Value (e.g. 5V, 16 GB)" 
              value={spec.value} 
              onChange={e => handleSpecChange(i, 'value', e.target.value)} 
              style={{ flex: 1.5 }}
            />
            <button 
              type="button" 
              className="btn btn-danger btn-sm" 
              onClick={() => handleRemoveSpecRow(i)} 
              style={{ padding: 'var(--space-2)' }}
              title="Delete Row"
            >
              <i className="fa-light fa-sharp fa-trash" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>Product Images</h3>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Upload high quality product pictures. Select one as the Main cover image by clicking on it.</p>
      </div>

      <div className="drag-drop-zone" style={{ margin: 'var(--space-2) 0' }}>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleMultipleImagesUpload} 
          disabled={uploading}
        />
        <div className="drag-drop-content">
          <i className="fa-light fa-sharp fa-cloud-arrow-up text-2xl" />
          <p>{uploading ? 'Uploading images...' : 'Click or drag files here (supports Ctrl+V clipboard paste)'}</p>
        </div>
      </div>

      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-4" style={{ background: 'rgba(255,255,255,0.01)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
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
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden'
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
                    top: 2, 
                    right: 2, 
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
                    padding: 0,
                    zIndex: 5
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
  );

  const renderStep5 = () => {
    const sellingPrice = parseFloat(form.price) || 0;
    const costPrice = parseFloat(form.cost_price) || 0;
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return (
      <div className="verify-grid">
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>Verify Product Details</h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Review and double-check all details before uploading to the store.</p>
        </div>

        {/* Card 1: Basic Info */}
        <div className="verify-card">
          <div className="verify-card__header">
            <span>Basic Catalog Details</span>
            <i className="fa-light fa-sharp fa-circle-info" />
          </div>
          <div className="verify-card__body">
            <div className="verify-data-list">
              <div className="verify-data-item">
                <span className="verify-data-label">Product Name</span>
                <span className="verify-data-value">{form.name}</span>
              </div>
              <div className="verify-data-item">
                <span className="verify-data-label">SKU</span>
                <span className="verify-data-value">{form.sku}</span>
              </div>
              <div className="verify-data-item">
                <span className="verify-data-label">Category</span>
                <span className="verify-data-value">{form.category}</span>
              </div>
              <div className="verify-data-item verify-data-item--full">
                <span className="verify-data-label">Description</span>
                <span className="verify-data-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{form.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pricing & Stock */}
        <div className="verify-card">
          <div className="verify-card__header">
            <span>Pricing & Inventory Status</span>
            <i className="fa-light fa-sharp fa-tag" />
          </div>
          <div className="verify-card__body">
            <div className="verify-data-list">
              <div className="verify-data-item">
                <span className="verify-data-label">Selling Price</span>
                <span className="verify-data-value" style={{ color: 'var(--accent)', fontWeight: 700 }}>Rs. {sellingPrice.toFixed(2)}</span>
              </div>
              <div className="verify-data-item">
                <span className="verify-data-label">Cost Price</span>
                <span className="verify-data-value">Rs. {costPrice.toFixed(2)}</span>
              </div>
              <div className="verify-data-item">
                <span className="verify-data-label">Net Profit Margin</span>
                <span className="verify-data-value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  Rs. {profit.toFixed(2)} ({margin.toFixed(2)}% margin)
                </span>
              </div>
              <div className="verify-data-item">
                <span className="verify-data-label">Fulfillment Stock</span>
                <span className="verify-data-value">
                  {form.stock_type === 'in_stock' 
                    ? `In Stock (${form.stock_quantity} units available)` 
                    : `Outsourced (~${form.outsource_days} days procurement)`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Technical Specs */}
        <div className="verify-card">
          <div className="verify-card__header">
            <span>Technical Specifications</span>
            <i className="fa-light fa-sharp fa-list-check" />
          </div>
          <div className="verify-card__body" style={{ padding: 0 }}>
            {specs.filter(s => s.key.trim()).length === 0 ? (
              <p style={{ padding: 'var(--space-4)', margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No specifications specified.</p>
            ) : (
              <table className="verify-specs-table">
                <thead>
                  <tr>
                    <th>Specification Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.filter(s => s.key.trim()).map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.key}</td>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Card 4: Gallery */}
        <div className="verify-card">
          <div className="verify-card__header">
            <span>Media & Gallery</span>
            <i className="fa-light fa-sharp fa-images" />
          </div>
          <div className="verify-card__body">
            {imageUrls.length === 0 ? (
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No images uploaded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {mainImageUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', background: 'var(--bg-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                    <img 
                      src={`http://localhost:5000${mainImageUrl}`} 
                      alt="" 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }} 
                      onError={e => { e.target.src = '/placeholder.png'; }}
                    />
                    <div>
                      <span className="verify-data-label" style={{ display: 'block' }}>Primary Cover Image</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{mainImageUrl}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {imageUrls.map((url, idx) => (
                    <img 
                      key={idx}
                      src={`http://localhost:5000${url}`} 
                      alt="" 
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: url === mainImageUrl ? '2px solid var(--accent)' : '1px solid var(--border)' }} 
                      onError={e => { e.target.src = '/placeholder.png'; }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal" style={{ maxWidth: '720px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="admin-modal__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="admin-modal__header">
            <h2 className="page-title">{product ? 'Edit Product' : 'New Product'}</h2>
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close dialog">
              <i className="fa-light fa-sharp fa-xmark" />
            </button>
          </div>
          
          {/* Stepper Progress Indicator */}
          <div className="wizard-stepper">
            {stepsConfig.map((sConfig, idx) => {
              const stepIdx = idx + 1;
              const isActive = step === stepIdx;
              const isCompleted = step > stepIdx;
              const isClickable = !!product || stepIdx <= step || isCompleted;

              return (
                <React.Fragment key={idx}>
                  <div 
                    className={`stepper-step ${isActive ? 'stepper-step--active' : ''} ${isCompleted ? 'stepper-step--completed' : ''} ${!isClickable ? 'stepper-step--disabled' : ''}`}
                    onClick={() => isClickable && handleStepClick(stepIdx)}
                  >
                    <div className="step-number">
                      {isCompleted ? <i className="fa-light fa-sharp fa-check" /> : stepIdx}
                    </div>
                    <span className="step-label">{sConfig.label}</span>
                  </div>
                  {idx < stepsConfig.length - 1 && (
                    <div className={`stepper-line ${step > stepIdx ? 'stepper-line--completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
            <div className="admin-modal__body" style={{ flex: 1, overflowY: 'auto', gap: 'var(--space-5)', padding: 'var(--space-6)' }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
            </div>
            
            <div className="admin-modal__footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-1)', zIndex: 5, padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              {step === 1 ? (
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={handleBack}>
                  <i className="fa-light fa-sharp fa-arrow-left" style={{ marginRight: '8px' }} /> Back
                </button>
              )}

              {step < 5 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next Step <i className="fa-light fa-sharp fa-arrow-right" style={{ marginLeft: '8px' }} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? (
                    <><i className="fa-light fa-sharp fa-spinner-third fa-spin" style={{ marginRight: '8px' }} /> Saving...</>
                  ) : (
                    <><i className="fa-light fa-sharp fa-floppy-disk" style={{ marginRight: '8px' }} /> {product ? 'Save Changes' : 'Publish Product'}</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
