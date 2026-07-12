import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export function Dashboard() {
  const [viajes, setViajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransportista, setIsTransportista] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const role = currentUser?.rol?.toLowerCase() || '';
        const isDriver = role === 'transportista';
        setIsTransportista(isDriver);

        const tripsResponse = await api.get('/viajes');
        let trips = tripsResponse.data;

        if (isDriver && currentUser) {
          const driversResponse = await api.get('/transportistas');
          const driver = driversResponse.data.find((t: any) => t.cedula === currentUser.cedula || t.correo === currentUser.correo);
          if (driver) {
            trips = trips.filter((v: any) => v.transportistaId === driver.id);
          } else {
            trips = [];
          }
        }

        setViajes(trips);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totales = viajes.length;
  const planificados = viajes.filter(v => v.estado === 'Disponible').length;
  const enTransito = viajes.filter(v => v.estado === 'EnCurso' || v.estado === 'Asignado').length;
  const completados = viajes.filter(v => v.estado === 'Finalizado').length;

  const recientes = [...viajes].reverse().slice(0, 3); // Últimos 3

  if (loading) {
    return (
      <Container className="p-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" className="text-tc-orange me-3" />
        <span className="fw-bold text-muted">Cargando métricas...</span>
      </Container>
    );
  }
  return (
    <Container className="mb-5" style={{ marginTop: '40px' }}>
      
      {isTransportista && viajes.some(v => v.estado === 'Asignado') && (
        <Alert variant="warning" className="mb-4 shadow-sm border-0 d-flex align-items-center p-3" style={{ borderRadius: '12px', background: '#fffbeb', borderLeft: '5px solid #d97706' }}>
          <i className="bi bi-bell-fill text-warning me-3 fs-3"></i>
          <div>
            <strong className="d-block text-tc-blue" style={{ fontSize: '1.05rem' }}>¡Tienes un nuevo viaje asignado!</strong>
            <span className="text-muted small">Tienes {viajes.filter(v => v.estado === 'Asignado').length} viaje(s) pendiente(s) de iniciar.</span>
          </div>
        </Alert>
      )}

      <Row className="g-4 mb-5">
        <Col md={3} xs={6}>
          <div className="summary-card accent-blue">
            <div className="icon-wrapper">
              <i className="bi bi-collection-fill"></i>
            </div>
            <div>
              <div className="number">{totales}</div>
              <div className="label">Total Viajes</div>
            </div>
          </div>
        </Col>
        <Col md={3} xs={6}>
          <div className="summary-card accent-orange">
            <div className="icon-wrapper">
              <i className="bi bi-calendar-check-fill"></i>
            </div>
            <div>
              <div className="number">{planificados}</div>
              <div className="label">Disponibles</div>
            </div>
          </div>
        </Col>
        <Col md={3} xs={6}>
          <div className="summary-card accent-blue">
            <div className="icon-wrapper text-tc-orange" style={{ background: 'rgba(242, 106, 33, 0.1)' }}>
              <i className="bi bi-truck-front-fill"></i>
            </div>
            <div>
              <div className="number">{enTransito}</div>
              <div className="label">En Tránsito</div>
            </div>
          </div>
        </Col>
        <Col md={3} xs={6}>
          <div className="summary-card accent-green">
            <div className="icon-wrapper text-success" style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div>
              <div className="number">{completados}</div>
              <div className="label">Completados</div>
            </div>
          </div>
        </Col>
      </Row>

      <h5 className="mb-4 fw-bold" style={{ color: 'var(--tc-blue-dark)' }}>Acciones Rápidas</h5>

      {!isTransportista ? (
        /* Admin: 5 tarjetas → fila 1: 3 cards, fila 2: 2 cards centradas */
        <>
          <Row className="g-4 mb-2">
            <Col md={4} sm={6}>
              <Link to="/transportistas" className="action-card">
                <div className="icon-wrapper">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="title">Transportistas</div>
                <div className="desc">Gestión y control de conductores</div>
              </Link>
            </Col>
            <Col md={4} sm={6}>
              <Link to="/viajes" className="action-card">
                <div className="icon-wrapper">
                  <i className="bi bi-cursor-fill"></i>
                </div>
                <div className="title">Viajes y Rutas</div>
                <div className="desc">Asignación y seguimiento</div>
              </Link>
            </Col>
            <Col md={4} sm={6}>
              <Link to="/documentos" className="action-card">
                <div className="icon-wrapper">
                  <i className="bi bi-file-earmark-check-fill"></i>
                </div>
                <div className="title">Documentación</div>
                <div className="desc">Validación de licencias y SOAT</div>
              </Link>
            </Col>
          </Row>
          <Row className="g-4 mb-5 justify-content-center">
            <Col md={4} sm={6}>
              <Link to="/reportes" className="action-card">
                <div className="icon-wrapper" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                  <i className="bi bi-bar-chart-line-fill"></i>
                </div>
                <div className="title">Reportes y Rutas</div>
                <div className="desc">Análisis y planificación de rutas</div>
              </Link>
            </Col>
            <Col md={4} sm={6}>
              <Link to="/monitoreo" className="action-card">
                <div className="icon-wrapper">
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <div className="title">Monitoreo GPS</div>
                <div className="desc">Rastreo de flota en tiempo real</div>
              </Link>
            </Col>
          </Row>
        </>
      ) : (
        /* Transportista: solo Monitoreo, ancho completo */
        <Row className="g-4 mb-5">
          <Col xs={12}>
            <Link to="/monitoreo" className="action-card">
              <div className="icon-wrapper">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div className="title">Monitoreo GPS</div>
              <div className="desc">Rastreo de flota en tiempo real</div>
            </Link>
          </Col>
        </Row>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0" style={{ color: 'var(--tc-blue-dark)' }}>Actividad Reciente</h5>
        {!isTransportista && (
          <Link to="/viajes" className="btn btn-link text-decoration-none text-tc-orange fw-bold p-0">Ver todos <i className="bi bi-arrow-right"></i></Link>
        )}
      </div>
      
      <div className="tc-card p-0 overflow-hidden">
        {recientes.length === 0 ? (
          <div className="p-4 text-center text-muted">Aún no hay viajes registrados.</div>
        ) : (
          recientes.map((v, index) => (
            <div key={v.id} className={`p-4 d-flex align-items-center justify-content-between ${index < recientes.length - 1 ? 'border-bottom' : ''}`}>
              <div className="d-flex align-items-center">
                <div className="icon-box me-3" style={{ width: '40px', height: '40px', borderRadius: '10px', background: v.estado === 'Finalizado' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(10, 66, 117, 0.1)', color: v.estado === 'Finalizado' ? '#27AE60' : 'var(--tc-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <i className="bi bi-truck"></i>
                </div>
                <div>
                  <div className="fw-bold text-tc-blue">{v.origen} → {v.destino}</div>
                  <div className="small text-muted"><i className="bi bi-box me-1"></i> {v.tipoMercancia} | {v.pesoCarga} Toneladas</div>
                </div>
              </div>
              <span className={`status-badge ${v.estado === 'EnCurso' || v.estado === 'Asignado' ? 'warning' : v.estado === 'Finalizado' ? 'success' : 'primary'}`}>{v.estado}</span>
            </div>
          ))
        )}
      </div>

    </Container>
  );
}
