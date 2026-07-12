import { useState, useEffect, useRef } from 'react';
import { Container, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { api } from '../services/api';

export function DocumentacionList() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [transportistas, setTransportistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{type: 'success'|'danger', msg: string} | null>(null);

  // Estados para subir un documento individual
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTransportistaId, setSelectedTransportistaId] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('SOAT');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, transRes] = await Promise.all([
        api.get('/documentos'),
        api.get('/transportistas')
      ]);
      setDocs(docsRes.data);
      setTransportistas(transRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTransportistaName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const t = transportistas.find(t => t.id === id);
    return t ? `${t.nombres} ${t.apellidos}` : 'Desconocido';
  };

  const getBadgeColorClass = (estado: string) => {
    if (estado === 'Aprobado' || estado === 'Vigente') return 'success';
    if (estado === 'Rechazado' || estado === 'Vencido') return 'danger';
    return 'warning';
  };

  const getDocIcon = (tipo: string) => {
    const tLower = tipo.toLowerCase();
    if (tLower.includes('licencia')) return 'bi-card-heading';
    if (tLower.includes('revision') || tLower.includes('revisión')) return 'bi-wrench-adjustable';
    if (tLower.includes('soat')) return 'bi-shield-exclamation';
    if (tLower.includes('matricula') || tLower.includes('matrícula')) return 'bi-file-earmark-text';
    return 'bi-file-text';
  };

  const handleUploadClick = () => {
    if (transportistas.length === 0) {
      alert('Debe haber al menos un transportista registrado.');
      return;
    }
    setSelectedTransportistaId(transportistas[0].id);
    setShowUploadModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('tipo', selectedTipo);
        formData.append('transportistaId', selectedTransportistaId);
        formData.append('documento', file);
        
        await api.post('/documentos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAlertInfo({ type: 'success', msg: 'Documento subido y registrado con éxito.' });
        setShowUploadModal(false);
        fetchData();
      } catch (error) {
        console.error('Error al subir documento', error);
        setAlertInfo({ type: 'danger', msg: 'Error al subir el documento.' });
      } finally {
        setUploading(false);
        setTimeout(() => setAlertInfo(null), 3000);
      }
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('documento', file);
        
        const response = await api.post('/documentos/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAlertInfo({ type: 'success', msg: response.data.message || 'Importación masiva completada con éxito.' });
        fetchData();
      } catch (error) {
        console.error('Error al importar documentos', error);
        setAlertInfo({ type: 'danger', msg: 'Error al importar los documentos. Verifica el formato del archivo.' });
      } finally {
        setUploading(false);
        setTimeout(() => setAlertInfo(null), 4000);
      }
    }
  };

  const handleVerArchivo = (ruta: string) => {
    // Abrir el archivo en una pestaña nueva si es un path relativo o absoluto accesible
    const win = window.open(`http://localhost:3000/${ruta}`, '_blank');
    win?.focus();
  };

  const handleDeleteClick = async (doc: any) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el documento de tipo ${doc.tipo}?`)) {
      setUploading(true);
      try {
        await api.delete(`/documentos/${doc.id}`);
        setAlertInfo({ type: 'success', msg: 'Documento eliminado con éxito.' });
        fetchData();
      } catch (error) {
        console.error('Error al eliminar documento', error);
        setAlertInfo({ type: 'danger', msg: 'Error al eliminar el documento.' });
      } finally {
        setUploading(false);
        setTimeout(() => setAlertInfo(null), 3000);
      }
    }
  };

  return (
    <Container className="p-4" style={{ maxWidth: '900px' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold m-0 text-tc-blue">Control de Documentación</h4>
          <p className="text-muted small m-0">Auditoría y estado de requisitos legales</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary px-3" onClick={handleImportClick} disabled={uploading}>
            <i className="bi bi-file-earmark-arrow-up me-2"></i> Importar JSON/CSV
          </button>
          <button className="btn-tc-primary" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
            {uploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
        
        <input 
          type="file" 
          ref={importInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImportChange}
          accept=".json,.csv"
        />
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

      {loading ? (
        <div className="tc-card d-flex justify-content-center align-items-center p-5">
          <Spinner animation="border" role="status" className="me-3 text-tc-orange" />
          <span className="text-muted fw-bold">Cargando documentación...</span>
        </div>
      ) : (
        <div className="tc-card p-0 overflow-hidden">
          {docs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-check mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
              No hay documentos registrados en el sistema.
            </div>
          ) : (
            docs.map((d, index) => {
              const colorClass = getBadgeColorClass(d.estado);
              return (
                <div key={d.id} className={`p-4 d-flex align-items-center justify-content-between ${index < docs.length - 1 ? 'border-bottom' : ''}`} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="d-flex align-items-center">
                    <div className="me-4" style={{ width: '48px', height: '48px', borderRadius: '12px', background: colorClass === 'danger' ? 'rgba(231, 76, 60, 0.1)' : colorClass === 'warning' ? 'rgba(242, 106, 33, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: colorClass === 'danger' ? '#C0392B' : colorClass === 'warning' ? 'var(--tc-orange-primary)' : '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      <i className={`bi ${getDocIcon(d.tipo)}`}></i>
                    </div>
                    <div>
                      <div className="fw-bold text-tc-blue" style={{ fontSize: '1.1rem' }}>{d.tipo}</div>
                      <div className="small text-muted mt-1"><i className="bi bi-person me-1"></i> Titular: <span className="fw-bold text-tc-blue">{getTransportistaName(d.transportistaId)}</span></div>
                      <div className="small text-muted"><i className="bi bi-calendar-event me-1"></i> Vencimiento: {d.vencimiento || 'No registrado'}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`status-badge ${colorClass}`}>{d.estado}</span>
                    <div className="mt-2 d-flex gap-2 justify-content-end align-items-center">
                      <button className="btn btn-sm btn-link text-decoration-none text-tc-orange fw-bold p-0" onClick={() => handleVerArchivo(d.rutaArchivo)}>Ver Archivo</button>
                      <span className="text-muted text-opacity-50">|</span>
                      <button className="btn btn-sm btn-link text-decoration-none text-danger fw-bold p-0" onClick={() => handleDeleteClick(d)}><i className="bi bi-trash me-1"></i>Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal para subir documento */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-tc-blue">Subir Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <label className="form-label small fw-bold text-muted">Tipo de Documento</label>
            <Form.Select className="custom-input" value={selectedTipo} onChange={e => setSelectedTipo(e.target.value)}>
              <option value="Cedula">Cédula de Identidad</option>
              <option value="Licencia Profesional">Licencia Profesional</option>
              <option value="Matricula">Matrícula Vehicular</option>
              <option value="Revision Tecnica">Revisión Técnica</option>
              <option value="SOAT">SOAT</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <label className="form-label small fw-bold text-muted">Transportista Relacionado</label>
            <Form.Select className="custom-input" value={selectedTransportistaId} onChange={e => setSelectedTransportistaId(e.target.value)}>
              {transportistas.map(t => (
                <option key={t.id} value={t.id}>{t.nombres} {t.apellidos} - Cédula: {t.cedula}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button className="btn btn-secondary px-3" onClick={() => setShowUploadModal(false)}>Cancelar</button>
          <button className="btn-tc-primary px-4" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
            Seleccionar Archivo
          </button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}
