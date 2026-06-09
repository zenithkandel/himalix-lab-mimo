import React, { useState, useRef, useEffect } from 'react';

const ImageUploadZone = ({ value, onChange, token, apiUrl, label = 'Image' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);
  const zoneRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Only image files are supported.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${apiUrl}/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed due to network error.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Paste handler
  useEffect(() => {
    const handlePaste = (e) => {
      // Only capture paste if this component or drag zone is active/focused
      if (document.activeElement === zoneRef.current) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              handleUpload(blob);
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [token, apiUrl]);

  return (
    <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
      <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{
            fontSize: '0.7rem',
            color: 'var(--accent-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {showUrlInput ? 'Use File Upload' : 'Paste Direct URL'}
        </button>
      </label>

      {showUrlInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            className="admin-form-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
          {value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={value.startsWith('/') ? `${apiUrl.replace('/api', '')}${value}` : value}
                alt="Preview"
                style={{ width: '48px', height: '48px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                onError={(e) => e.target.style.display = 'none'}
              />
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-danger"
                onClick={() => onChange('')}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            ref={zoneRef}
            tabIndex={0} // Make element focusable to capture paste events
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            style={{
              border: isDragging ? '1px dashed var(--accent-primary)' : '1px dashed var(--border-color)',
              background: isDragging ? 'rgba(224, 175, 60, 0.05)' : 'rgba(255, 255, 255, 0.01)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              outline: 'none',
              transition: 'var(--transition-fast)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} />
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>UPLOADING FILE...</span>
              </div>
            ) : value ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                <img
                  src={value.startsWith('/') ? `${apiUrl.replace('/api', '')}${value}` : value}
                  alt="Uploaded preview"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="admin-btn admin-btn-sm" onClick={triggerFileSelect}>
                    Change
                  </button>
                  <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => onChange('')}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <i className="fa-light fa-sharp fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>Drag & drop image here, or <strong style={{ color: 'var(--text-primary)' }}>click to browse</strong></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Click this zone and press Ctrl+V to paste from clipboard</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
