import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('token', 'demo-token');
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--tc-blue-dark) 0%, var(--tc-blue-primary) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      <div className="text-center text-white mb-5" style={{ animation: 'fadeInDown 0.8s ease' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', transform: 'rotate(45deg)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}></div>
          <i className="bi bi-truck text-tc-orange position-absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.5rem' }}></i>
        </div>
        <h1 className="fw-bold mb-1" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>TransControl</h1>
        <p className="opacity-75" style={{ fontSize: '1.1rem' }}>Gestión Premium de Transporte</p>
      </div>

      <div className="tc-card" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}>
        <h4 className="fw-bold mb-4 text-center">Iniciar Sesión</h4>
        <Form onSubmit={handleLogin}>
          
          <div className="input-icon-wrapper mb-3">
            <i className="bi bi-envelope"></i>
            <Form.Control 
              type="email" 
              placeholder="Correo Electrónico" 
              className="custom-input" 
              value={correo}
              onChange={e => setCorreo(e.target.value)}
            />
          </div>

          <div className="input-icon-wrapper mb-2">
            <i className="bi bi-lock"></i>
            <Form.Control 
              type="password" 
              placeholder="Contraseña" 
              className="custom-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="text-end mb-4">
            <Link to="/recuperar-contrasena" className="text-decoration-none small" style={{ color: 'var(--tc-blue-light)', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="btn-tc-primary w-100 py-3 mb-4" style={{ fontSize: '1.1rem' }}>
            Ingresar al Sistema <i className="bi bi-arrow-right ms-2"></i>
          </button>

          <div className="text-center mt-3 small text-muted">
            ¿No tienes cuenta? <Link to="/registro" className="text-decoration-none text-tc-orange fw-bold">Regístrate aquí</Link>
          </div>
        </Form>
      </div>

      {/* Tarjeta de Credenciales Demo */}
      <div className="mt-4 p-3 rounded shadow-sm bg-white" style={{ maxWidth: '420px', width: '100%', borderLeft: '4px solid var(--tc-orange-primary)' }}>
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-info-circle-fill text-tc-blue me-2 fs-5"></i>
          <h6 className="mb-0 fw-bold text-tc-blue">Credenciales de Acceso</h6>
        </div>
        <div className="small text-muted d-flex justify-content-between">
          <span><strong>Correo:</strong> admin@transcontrol.com</span>
          <span><strong>Clave:</strong> admin123</span>
        </div>
      </div>
      
      <div className="text-white opacity-50 mt-4 small">
        &copy; 2026 TransControl. Todos los derechos reservados.
      </div>
    </div>
  );
}
