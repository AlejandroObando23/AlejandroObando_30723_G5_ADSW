import { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';

export function AuditoriaList() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const logs = [
    { id: 1, fecha: new Date().toLocaleString(), usuario: 'Admin Sistema', rol: 'Admin', modulo: 'Auth', accion: 'Inicio de sesión exitoso', icon: 'bi-shield-lock', color: 'primary' },
    { id: 2, fecha: new Date(Date.now() - 3600000).toLocaleString(), usuario: 'Juan Perez', rol: 'Sistema', modulo: 'Viajes', accion: 'Evento disparado: VIAJE_CREADO', icon: 'bi-truck', color: 'success' },
    { id: 3, fecha: new Date(Date.now() - 7200000).toLocaleString(), usuario: 'Sistema Automático', rol: 'Bot', modulo: 'Documentos', accion: 'SOAT Vencido detectado', icon: 'bi-exclamation-triangle', color: 'danger' },
  ];

  return (
    <Container className="p-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-tc-blue">Auditoría del Sistema</h4>
          <p className="text-muted small m-0">Registro inmutable de eventos y transacciones</p>
        </div>
      </div>

      {loading ? (
        <div className="tc-card d-flex justify-content-center align-items-center p-5">
          <Spinner animation="border" role="status" className="me-3 text-tc-orange" />
          <span className="text-muted fw-bold">Cargando registros...</span>
        </div>
      ) : (
        <div className="tc-card p-0 overflow-hidden">
          {logs.map((log, index) => (
            <div key={log.id} className={`p-4 d-flex align-items-center ${index < logs.length - 1 ? 'border-bottom' : ''}`} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="me-4" style={{ width: '45px', height: '45px', borderRadius: '50%', background: log.color === 'danger' ? 'rgba(231, 76, 60, 0.1)' : log.color === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(10, 66, 117, 0.1)', color: log.color === 'danger' ? '#C0392B' : log.color === 'success' ? '#27AE60' : 'var(--tc-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <i className={log.icon}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="fw-bold text-tc-blue">{log.usuario} <span className="badge bg-light text-secondary border ms-2">{log.rol}</span></div>
                  <div className="small text-muted font-monospace">{log.fecha}</div>
                </div>
                <div className="small text-muted"><span className={`fw-bold text-${log.color}`}>{log.modulo}</span> &mdash; {log.accion}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
