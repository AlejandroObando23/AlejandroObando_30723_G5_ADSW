import { useState, useRef } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { api } from '../services/api';

export function DocumentacionList() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{type: 'success'|'danger', msg: string} | null>(null);

  const docs = [
    { id: 1, nombre: 'Licencia Profesional C1', tipo: 'Licencia', transportista: 'Luis Fernando Mendoza', vencimiento: '2027-12-31', estado: 'Vigente', colorClass: 'success', icon: 'bi-card-heading' },
    { id: 2, nombre: 'Revisión Técnico-Mecánica', tipo: 'Revisión', transportista: 'Carlos Zambrano', vencimiento: '2025-06-30', estado: 'Vigente', colorClass: 'success', icon: 'bi-wrench-adjustable' },
    { id: 3, nombre: 'Póliza SOAT', tipo: 'SOAT', transportista: 'María Pérez', vencimiento: '2024-03-15', estado: 'Vencido', colorClass: 'danger', icon: 'bi-shield-exclamation' },
    { id: 4, nombre: 'Matrícula Vehicular', tipo: 'Matrícula', transportista: 'Luis Fernando Mendoza', vencimiento: '2030-01-01', estado: 'En Revisión', colorClass: 'warning', icon: 'bi-file-text' },
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('tipo', 'SOAT'); // Por defecto, se podría mejorar pidiendo el tipo
        formData.append('transportistaId', 't1');
        formData.append('documento', file);
        
        await api.post('/documentacion/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAlertInfo({ type: 'success', msg: 'Archivo subido con éxito a la carpeta de uploads.' });
      } catch (error) {
        console.error('Error al subir documento', error);
        setAlertInfo({ type: 'danger', msg: 'Error al subir el documento.' });
      } finally {
        setUploading(false);
        // Clear alert after 3s
        setTimeout(() => setAlertInfo(null), 3000);
      }
    }
  };

  return (
    <Container className="p-4" style={{ maxWidth: '900px' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-tc-blue">Control de Documentación</h4>
          <p className="text-muted small m-0">Auditoría y estado de requisitos legales</p>
        </div>
        <button className="btn-tc-primary" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
          {uploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </div>

      {alertInfo && (
        <Alert variant={alertInfo.type} onClose={() => setAlertInfo(null)} dismissible>
          <i className={`bi ${alertInfo.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alertInfo.msg}
        </Alert>
      )}

      <div className="tc-card p-0 overflow-hidden">
        {docs.map((d, index) => (
          <div key={d.id} className={`p-4 d-flex align-items-center justify-content-between ${index < docs.length - 1 ? 'border-bottom' : ''}`} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="d-flex align-items-center">
              <div className="me-4" style={{ width: '48px', height: '48px', borderRadius: '12px', background: d.colorClass === 'danger' ? 'rgba(231, 76, 60, 0.1)' : d.colorClass === 'warning' ? 'rgba(242, 106, 33, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: d.colorClass === 'danger' ? '#C0392B' : d.colorClass === 'warning' ? 'var(--tc-orange-primary)' : '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                <i className={d.icon}></i>
              </div>
              <div>
                <div className="fw-bold text-tc-blue" style={{ fontSize: '1.1rem' }}>{d.nombre}</div>
                <div className="small text-muted mt-1"><i className="bi bi-person me-1"></i> Titular: {d.transportista}</div>
                <div className="small text-muted"><i className="bi bi-calendar-event me-1"></i> Vencimiento: {d.vencimiento}</div>
              </div>
            </div>
            <div className="text-end">
              <span className={`status-badge ${d.colorClass}`}>{d.estado}</span>
              <div className="mt-2">
                <button className="btn btn-sm btn-link text-decoration-none text-muted fw-bold">Ver Archivo</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
