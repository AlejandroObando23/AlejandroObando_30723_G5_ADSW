import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export function RecuperarContrasena() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      
      <div className="tc-card" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
        
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-tc-orange" style={{ fontSize: '3rem' }}></i>
          <h3 className="fw-bold text-tc-blue mt-2">Recuperar Contraseña</h3>
          <p className="text-muted small">Ingresa tu correo para recibir las instrucciones</p>
        </div>

        {enviado ? (
          <div className="alert alert-success text-center border-0" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#27AE60' }}>
            <i className="bi bi-check-circle-fill fs-4 d-block mb-2"></i>
            Si el correo <strong>{correo}</strong> existe, recibirás un enlace de recuperación.
            <div className="mt-2 small text-muted">Redirigiendo al login...</div>
          </div>
        ) : (
          <Form onSubmit={handleRecover}>
            <div className="input-icon-wrapper mb-4">
              <i className="bi bi-envelope"></i>
              <Form.Control 
                type="email" placeholder="Correo Electrónico" className="custom-input" 
                value={correo} onChange={e => setCorreo(e.target.value)} required
              />
            </div>

            <button type="submit" className="btn-tc-primary w-100 py-3 mb-4" style={{ fontSize: '1.1rem' }}>
              Enviar Enlace <i className="bi bi-send-fill ms-2"></i>
            </button>
          </Form>
        )}

        <div className="text-center small text-muted">
          <Link to="/login" className="text-decoration-none text-tc-blue fw-bold"><i className="bi bi-arrow-left"></i> Volver al Inicio de Sesión</Link>
        </div>
      </div>
    </div>
  );
}
