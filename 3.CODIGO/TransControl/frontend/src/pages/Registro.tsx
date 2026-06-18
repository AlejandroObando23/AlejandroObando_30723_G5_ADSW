import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export function Registro() {
  const [formData, setFormData] = useState({
    tipoUsuario: 'Transportista',
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      
      <div className="tc-card" style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
        
        <div className="text-center mb-4">
          <i className="bi bi-person-badge-fill text-tc-orange" style={{ fontSize: '3rem' }}></i>
          <h3 className="fw-bold text-tc-blue mt-2">Crear Cuenta</h3>
          <p className="text-muted small">Únete a la red TransControl</p>
        </div>

        <Form onSubmit={handleRegister}>
          
          <Form.Group className="mb-4">
            <label className="form-label small fw-bold text-muted">Soy un...</label>
            <div className="input-icon-wrapper">
              <i className="bi bi-briefcase-fill text-tc-blue"></i>
              <Form.Select 
                className="custom-input"
                value={formData.tipoUsuario}
                onChange={e => setFormData({...formData, tipoUsuario: e.target.value})}
              >
                <option value="Transportista">Conductor / Transportista</option>
                <option value="Administrador">Administrador de Logística</option>
              </Form.Select>
            </div>
          </Form.Group>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-person"></i>
                <Form.Control 
                  type="text" placeholder="Nombres" className="custom-input" 
                  value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-person"></i>
                <Form.Control 
                  type="text" placeholder="Apellidos" className="custom-input" 
                  value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="input-icon-wrapper mb-3">
            <i className="bi bi-envelope"></i>
            <Form.Control 
              type="email" placeholder="Correo Electrónico" className="custom-input" 
              value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})}
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-lock"></i>
                <Form.Control 
                  type="password" placeholder="Contraseña" className="custom-input" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="input-icon-wrapper">
                <i className="bi bi-lock-fill"></i>
                <Form.Control 
                  type="password" placeholder="Confirmar" className="custom-input" 
                  value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-tc-primary w-100 py-3 mb-4" style={{ fontSize: '1.1rem' }}>
            Registrarme <i className="bi bi-arrow-right ms-2"></i>
          </button>

          <div className="text-center small text-muted">
            ¿Ya tienes una cuenta? <Link to="/login" className="text-decoration-none text-tc-blue fw-bold">Inicia Sesión aquí</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
