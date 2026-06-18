import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (path === '/login' || path === '/registro') return null;

  if (path === '/' || path === '/dashboard') {
    return (
      <div className="dashboard-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', transform: 'rotate(10deg)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
            <i className="bi bi-person-fill text-tc-orange" style={{ fontSize: '1.8rem', transform: 'rotate(-10deg)' }}></i>
          </div>
          <div>
            <h1 className="mb-1">¡Hola, Juan! 👋</h1>
            <span className="badge rounded-pill mt-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>ADMINISTRADOR</span>
          </div>
        </div>
        <div>
          <i className="bi bi-bell-fill me-4" style={{ fontSize: '1.4rem', cursor: 'pointer', transition: 'color 0.2s', opacity: 0.9 }} title="Notificaciones"></i>
          <i className="bi bi-box-arrow-right" style={{ fontSize: '1.4rem', cursor: 'pointer', transition: 'color 0.2s', opacity: 0.9 }} onClick={handleLogout} title="Cerrar Sesión"></i>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (path.includes('crear-transportista')) return 'Crear Transportista';
    if (path.includes('transportistas')) return 'Transportistas';
    if (path.includes('crear-viaje')) return 'Crear Viaje';
    if (path.includes('viajes')) return 'Viajes';
    if (path.includes('documentos')) return 'Documentación';
    if (path.includes('monitoreo')) return 'Monitoreo de Rutas';
    if (path.includes('auditoria')) return 'Auditoría del Sistema';
    return 'TransControl';
  };

  return (
    <div className="page-header d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <Link to="/" className="back-btn"><i className="bi bi-arrow-left-short" style={{ fontSize: '1.8rem' }}></i></Link>
        <h1 className="fw-bold">{getTitle()}</h1>
      </div>
      <div>
        <i className="bi bi-box-arrow-right text-tc-blue" style={{ fontSize: '1.4rem', cursor: 'pointer' }} onClick={handleLogout} title="Cerrar Sesión"></i>
      </div>
    </div>
  );
}
