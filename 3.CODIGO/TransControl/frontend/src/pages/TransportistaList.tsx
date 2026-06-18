import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Container, Spinner, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

interface Transportista {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  estado: string;
}

export function TransportistaList() {
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Delete Modal and Alerts
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transportistaToDelete, setTransportistaToDelete] = useState<{id: string, nombre: string} | null>(null);
  const [alertInfo, setAlertInfo] = useState<{type: 'success'|'danger', msg: string} | null>(null);

  useEffect(() => {
    fetchTransportistas();
  }, []);

  const fetchTransportistas = async () => {
    try {
      const response = await api.get('/transportistas');
      setTransportistas(response.data);
    } catch (error) {
      console.error('Error fetching transportistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string, nombre: string) => {
    setTransportistaToDelete({ id, nombre });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!transportistaToDelete) return;
    try {
      await api.delete(`/transportistas/${transportistaToDelete.id}`);
      setTransportistas(transportistas.filter(t => t.id !== transportistaToDelete.id));
      setShowDeleteModal(false);
      setAlertInfo({ type: 'success', msg: `Transportista ${transportistaToDelete.nombre} eliminado correctamente.` });
    } catch (error) {
      console.error('Error deleting transportista:', error);
      setShowDeleteModal(false);
      setAlertInfo({ type: 'danger', msg: 'Error al eliminar. Verifica la conexión con el servidor.' });
    } finally {
      setTimeout(() => setAlertInfo(null), 4000);
    }
  };

  const filteredTransportistas = transportistas.filter(t => 
    t.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cedula.includes(searchTerm)
  );

  return (
    <Container className="p-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-tc-blue">Directorio de Transportistas</h4>
          <p className="text-muted small m-0">Gestiona los conductores y vehículos registrados</p>
        </div>
        <div style={{ width: '250px' }}>
          <div className="input-icon-wrapper">
            <i className="bi bi-search"></i>
            <input 
              type="text" 
              className="custom-input form-control w-100" 
              placeholder="Buscar por nombre o CI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
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
          <span className="text-muted fw-bold">Cargando base de datos...</span>
        </div>
      ) : (
        <div className="tc-card p-0 overflow-hidden">
          {filteredTransportistas.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
              {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'No hay transportistas registrados.'}
            </div>
          ) : (
            filteredTransportistas.map((t, index) => (
              <div key={t.id} className={`p-4 d-flex align-items-center justify-content-between ${index < filteredTransportistas.length - 1 ? 'border-bottom' : ''}`} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="d-flex align-items-center">
                  <div className="me-4" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--tc-blue-light) 0%, var(--tc-blue-primary) 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(10, 66, 117, 0.2)' }}>
                    {t.nombres.charAt(0)}{t.apellidos.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-bold text-tc-blue" style={{ fontSize: '1.1rem' }}>{t.nombres} {t.apellidos}</div>
                    <div className="small text-muted mt-1"><i className="bi bi-person-badge me-1"></i> CC: {t.cedula}</div>
                    <div className="small text-muted"><i className="bi bi-telephone me-1"></i> {t.telefono} | <i className="bi bi-envelope ms-1 me-1"></i> {t.correo}</div>
                  </div>
                </div>
                  <div className="text-end">
                    <span className={`status-badge ${t.estado === 'Activo' ? 'success' : 'danger'}`}>
                      {t.estado}
                    </span>
                    <div className="mt-3 d-flex gap-2 justify-content-end">
                      <Link to={`/editar-transportista/${t.id}`} className="btn btn-sm btn-outline-primary" title="Editar"><i className="bi bi-pencil-fill"></i></Link>
                      <button className="btn btn-sm btn-outline-danger" title="Eliminar" onClick={() => confirmDelete(t.id, t.nombres)}><i className="bi bi-trash-fill"></i></button>
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="position-fixed" style={{ bottom: '30px', right: '30px' }}>
        <Link to="/crear-transportista" className="fab-btn text-decoration-none">
          <i className="bi bi-person-plus-fill"></i>
        </Link>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-tc-blue"><i className="bi bi-exclamation-circle text-danger me-2"></i>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 text-muted">
          ¿Estás seguro de que deseas eliminar permanentemente al transportista <strong className="text-tc-blue">{transportistaToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button className="btn-tc-outline" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
          <button className="btn btn-danger px-4" style={{ borderRadius: '8px' }} onClick={handleDelete}>
            <i className="bi bi-trash-fill me-2"></i>Eliminar
          </button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}
