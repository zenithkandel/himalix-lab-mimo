import React, { useState, useRef, useEffect } from 'react';

const FileUploadZone = ({ value, onChange, token, apiUrl, label = 'Image' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  useEffect(() => {
    const handlePaste = (e) => {
      // Allow paste if the zone is directly focused, or if the user is hovering over it
      if (document.activeElement === zoneRef.current || isHovered) {
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
  }, [token, apiUrl, isHovered]);

  return (
    <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
      <label className="admin-form-label">{label}</label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          ref={zoneRef}
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          style={{
            border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
            background: isDragging ? 'rgba(224, 175, 60, 0.05)' : 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all var(--transition-fast) ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
             setIsHovered(true);
             if(!isDragging) e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
             setIsHovered(false);
             if(!isDragging) e.currentTarget.style.borderColor = 'var(--border-color)';
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)' }}>
              <div className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>UPLOADING...</span>
            </div>
          ) : value ? (
            <div 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }} 
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-color)'
              }}>
                <img
                  src={value.startsWith('/') ? `${apiUrl.replace('/api', '')}${value}` : value}
                  alt="Uploaded preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={triggerFileSelect}>
                  <i className="fa-light fa-sharp fa-pen" /> Change
                </button>
                <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => onChange('')}>
                  <i className="fa-light fa-sharp fa-trash" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '50%', 
                background: 'rgba(224, 175, 60, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' 
              }}>
                <i className="fa-light fa-sharp fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-0)' }}>
                Click to upload or drag and drop
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                SVG, PNG, JPG or GIF (max. 5MB)
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+V</kbd> to paste
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;
