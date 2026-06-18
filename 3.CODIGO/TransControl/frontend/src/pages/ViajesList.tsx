import { useEffect, useState } from 'react';
import { Container, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export function ViajesList() {
  const [viajes, setViajes] = useState<any[]>([]);
  const [transportistas, setTransportistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedViaje, setSelectedViaje] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [viajesRes, transRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/transportistas')
      ]);
      setViajes(viajesRes.data);
      setTransportistas(transRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTransportistaName = (id: string) => {
    if (!id) return 'Sin asignar';
    const t = transportistas.find(t => t.id === id);
    return t ? `${t.nombres} ${t.apellidos}` : 'Desconocido';
  };

  const handleVerDetalles = (viaje: any) => {
    setSelectedViaje(viaje);
    setShowModal(true);
  };

  const getBadgeClass = (estado: string) => {
    if (estado === 'Completado') return 'success';
    if (estado === 'Cancelado') return 'danger';
    if (estado === 'Asignado' || estado === 'EnCurso') return 'warning';
    return 'primary';
  };

  return (
    <Container className="p-4" style={{ maxWidth: '900px' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-tc-blue">Gestión de Viajes</h4>
          <p className="text-muted small m-0">Administra y monitorea las rutas asignadas</p>
        </div>
      </div>

      {loading ? (
        <div className="tc-card d-flex justify-content-center align-items-center p-5">
          <Spinner animation="border" role="status" className="me-3 text-tc-orange" />
          <span className="text-muted fw-bold">Cargando rutas...</span>
        </div>
      ) : (
        <div className="tc-card p-0 overflow-hidden">
          {viajes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-map mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
              No hay viajes planificados.
            </div>
          ) : (
            viajes.map((v, index) => {
              const badgeClass = getBadgeClass(v.estado);
              return (
                <div key={v.id} className={`p-4 d-flex align-items-center justify-content-between ${index < viajes.length - 1 ? 'border-bottom' : ''}`} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="d-flex align-items-center">
                    <div className="icon-box me-4" style={{ width: '48px', height: '48px', borderRadius: '12px', background: badgeClass === 'warning' ? 'rgba(242, 106, 33, 0.1)' : badgeClass === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(10, 66, 117, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      <i className={`bi bi-truck text-${badgeClass === 'warning' ? 'tc-orange' : badgeClass === 'success' ? 'success' : 'tc-blue'}`}></i>
                    </div>
                    <div>
                      <div className="fw-bold text-tc-blue" style={{ fontSize: '1.1rem' }}>{v.origen} <i className="bi bi-arrow-right text-muted mx-1"></i> {v.destino}</div>
                      <div className="small text-muted mt-1"><i className="bi bi-box-seam me-1"></i> Carga: {v.tipoMercancia} | {v.pesoCarga} Ton</div>
                      <div className="small text-muted mt-1"><i className="bi bi-person-badge me-1"></i> Transportista: <span className="fw-bold">{getTransportistaName(v.transportistaId)}</span></div>
                      <div className="small text-muted mt-1"><i className="bi bi-calendar3 me-1"></i> Creado: {new Date(v.fechaCreacion).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`status-badge ${badgeClass}`}>{v.estado}</span>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-link text-decoration-none text-tc-orange fw-bold" onClick={() => handleVerDetalles(v)}>Ver Detalles</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      <div className="position-fixed" style={{ bottom: '30px', right: '30px' }}>
        <Link to="/crear-viaje" className="fab-btn text-decoration-none">
          <i className="bi bi-plus"></i>
        </Link>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-tc-blue">Detalles del Viaje</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {selectedViaje && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ background: 'var(--bg-body)' }}>
                <div className="text-center">
                  <div className="small text-muted fw-bold text-uppercase">Origen</div>
                  <div className="fw-bold text-tc-blue fs-5">{selectedViaje.origen}</div>
                </div>
                <i className="bi bi-arrow-right text-tc-orange fs-4"></i>
                <div className="text-center">
                  <div className="small text-muted fw-bold text-uppercase">Destino</div>
                  <div className="fw-bold text-tc-blue fs-5">{selectedViaje.destino}</div>
                </div>
              </div>

              <div className="mb-2"><strong>Mercancía:</strong> <span className="text-muted">{selectedViaje.tipoMercancia} ({selectedViaje.pesoCarga} Ton)</span></div>
              <div className="mb-2"><strong>Transportista Asignado:</strong> <span className="text-tc-blue fw-bold">{getTransportistaName(selectedViaje.transportistaId)}</span></div>
              <div className="mb-2"><strong>Fecha Creación:</strong> <span className="text-muted">{new Date(selectedViaje.fechaCreacion).toLocaleString()}</span></div>
              <div className="mb-2"><strong>Estado Actual:</strong> <span className={`badge bg-${getBadgeClass(selectedViaje.estado) === 'warning' ? 'warning text-dark' : getBadgeClass(selectedViaje.estado)} ms-2`}>{selectedViaje.estado}</span></div>
              
              <hr />
              <div className="mb-2"><strong>Observaciones Especiales:</strong></div>
              <p className="text-muted small p-3 rounded border" style={{ background: '#f8fafc' }}>
                <i className="bi bi-info-circle text-tc-blue me-2"></i>
                {selectedViaje.observaciones || 'Sin observaciones.'}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button className="btn-tc-primary w-100" onClick={() => setShowModal(false)}>Cerrar Detalles</button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}
