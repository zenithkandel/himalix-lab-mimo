import React, { useState, useEffect, useCallback } from 'react';
import FileUploadZone from '../../../components/FileUploadZone';

export default function CrudSection({ sectionName, label, schema, token, apiUrl, authFetch }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/${sectionName}`);
      if (res.ok) {
        const data = await res.json();
        // ensure features is stringified if array or JSON string
        const normalized = data.map(item => {
          let features = item.features;
          if (typeof features === 'string' && features.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(features);
              if (Array.isArray(parsed)) {
                features = parsed;
              }
            } catch (e) {}
          }
          return {
            ...item,
            features: Array.isArray(features) ? features.join('\n') : (features || '')
          };
        });
        setItems(normalized);
      }
    } catch (e) {
      console.error(`Error fetching ${sectionName}:`, e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, sectionName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSaveOrder = async (newItems) => {
    const payload = newItems.map((item, idx) => ({ id: item.id, display_order: idx }));
    try {
      await authFetch(`/api/admin/${sectionName}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ items: payload })
      });
    } catch (e) {
      console.error('Error saving order', e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await authFetch(`/api/admin/${sectionName}/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('Error deleting item', e);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const payload = { ...item, is_active: !item.is_active };
      if (sectionName === 'services' && payload.features) {
         payload.features = typeof payload.features === 'string' ? payload.features.split('\n').filter(Boolean) : payload.features;
      }
      await authFetch(`/api/admin/${sectionName}/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (e) {
      console.error('Error toggling status', e);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      const blank = { is_active: true };
      schema.forEach(f => { blank[f.key] = f.type === 'number' ? 0 : ''; });
      setEditingItem(blank);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveItem = async () => {
    setSaving(true);
    try {
      const payload = { ...editingItem };
      if (sectionName === 'services' && payload.features) {
         payload.features = typeof payload.features === 'string' ? payload.features.split('\n').filter(Boolean) : payload.features;
      }

      const method = payload.id ? 'PUT' : 'POST';
      const url = payload.id ? `/api/admin/${sectionName}/${payload.id}` : `/api/admin/${sectionName}`;

      // If new item, put it at the end
      if (!payload.id) {
        payload.display_order = items.length;
      }

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const savedItem = await res.json();
      
      if (savedItem.features) {
        let features = savedItem.features;
        if (typeof features === 'string' && features.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(features);
            if (Array.isArray(parsed)) {
              features = parsed;
            }
          } catch (e) {}
        }
        savedItem.features = Array.isArray(features) ? features.join('\n') : (features || '');
      }

      if (payload.id) {
        setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
      } else {
        setItems(prev => [...prev, savedItem]);
      }
      closeModal();
    } catch (e) {
      console.error('Error saving item', e);
      alert('Failed to save. Please check required fields.');
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setItems(newItems);
    handleSaveOrder(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getPrimaryText = (item) => {
    return item.title || item.name || item.client_name || item.label || 'Unnamed Item';
  };
  const getSecondaryText = (item) => {
    return item.subtitle || item.role || item.client_title || item.stat_value || '';
  };
  const getImage = (item) => {
    return item.image_url || item.avatar_url || '';
  };
  const getIcon = (item) => {
    return item.icon || item.icon_class || '';
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="crud-section">
      <div className="crud-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: '600' }}>{label} Management</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <i className="fa-light fa-sharp fa-plus" /> Add New
        </button>
      </div>

      <div className="crud-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <i className="fa-light fa-sharp fa-folder-open" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>No items found. Click "Add New" to create one.</p>
          </div>
        ) : (
          items.map((item, i) => {
            const isDragging = i === draggedIndex;
            const isDragOver = i === dragOverIndex && i !== draggedIndex;
            
            return (
              <div
                key={item.id}
                className={`crud-list-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: isDragOver ? '2px dashed var(--accent)' : '1px solid var(--border-color)',
                  opacity: isDragging ? 0.5 : 1,
                  transition: 'all 0.2s',
                  gap: 'var(--space-4)'
                }}
              >
                <div style={{ cursor: 'grab', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
                  <i className="fa-light fa-sharp fa-grip-dots-vertical" />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, cursor: 'pointer' }} onClick={() => openModal(item)}>
                  {getImage(item) ? (
                    <img src={getImage(item)} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : getIcon(item) ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <i className={`fa-light fa-sharp fa-${getIcon(item)}`} />
                    </div>
                  ) : null}
                  
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-0)' }}>{getPrimaryText(item)}</div>
                    {getSecondaryText(item) && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{getSecondaryText(item)}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <button 
                    className={`btn btn-sm ${item.is_active ? 'btn-ghost' : 'btn-outline'}`}
                    style={{ color: item.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                    onClick={() => handleToggleActive(item)}
                    title={item.is_active ? 'Active (click to disable)' : 'Hidden (click to enable)'}
                  >
                    <i className={`fa-light fa-sharp ${item.is_active ? 'fa-eye' : 'fa-eye-slash'}`} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(item)}>
                    <i className="fa-light fa-sharp fa-pen" />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(item.id)}>
                    <i className="fa-light fa-sharp fa-trash" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="admin-modal" style={{ 
            background: 'var(--bg-primary)', 
            borderRadius: 'var(--radius-lg)', 
            width: '100%', 
            maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{editingItem?.id ? 'Edit' : 'Add'} {label}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                <i className="fa-light fa-sharp fa-xmark" style={{ fontSize: '1.25rem' }} />
              </button>
            </div>
            
            <div style={{ padding: 'var(--space-4)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {schema.map(field => (
                  <div key={field.key} className="form-group">
                    {field.type === 'image' ? (
                      <FileUploadZone
                        value={editingItem[field.key] || ''}
                        onChange={val => setEditingItem(prev => ({ ...prev, [field.key]: val }))}
                        token={token}
                        apiUrl={apiUrl}
                        label={field.label}
                      />
                    ) : (
                      <>
                        <label className="form-label" style={{ fontWeight: 500 }}>{field.label}</label>
                        {field.multiline ? (
                          <textarea
                            className="form-textarea"
                            value={editingItem[field.key] || ''}
                            onChange={e => setEditingItem(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder || ''}
                            style={{ minHeight: '100px' }}
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            className="form-input"
                            value={editingItem[field.key] || ''}
                            onChange={e => setEditingItem(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                            placeholder={field.placeholder || ''}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'var(--space-2)' }}>
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={editingItem.is_active !== false}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>Active (Visible on website)</label>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveItem} disabled={saving}>
                {saving ? (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
                ) : (
                  <><i className="fa-light fa-sharp fa-floppy-disk" /> Save {label}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
