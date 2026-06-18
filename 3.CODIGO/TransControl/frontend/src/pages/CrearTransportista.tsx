import { useState, useEffect } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export function CrearTransportista() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', cedula: '', telefono: '', correo: '', direccion: '', estado: 'Activo'
  });
  const [vehiculo, setVehiculo] = useState({ tipo: '', placa: '', marca: '', anio: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchTransportista = async () => {
        try {
          const response = await api.get(`/transportistas/${id}`);
          if (response.data) {
            setFormData(response.data);
          }
        } catch (error) {
          setErrorMsg('Error al cargar los datos del transportista.');
        }
      };
      fetchTransportista();
    }
  }, [id, isEditing]);

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números y máximo 10 caracteres
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({...formData, cedula: val});
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const val = e.target.value.replace(/\D/g, '');
    setFormData({...formData, telefono: val});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isEditing) {
        await api.put(`/transportistas/${id}`, formData);
        setSuccessMsg('Transportista actualizado exitosamente. Redirigiendo...');
      } else {
        await api.post('/transportistas', formData);
        setSuccessMsg('Transportista creado exitosamente. Redirigiendo...');
      }
      setTimeout(() => navigate('/transportistas'), 1500);
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        const errData = error.response.data.error;
        if (Array.isArray(errData)) {
          setErrorMsg(errData.map((e: any) => e.message).join(' | '));
        } else {
          setErrorMsg(errData);
        }
      } else {
        setErrorMsg(`Error al ${isEditing ? 'actualizar' : 'crear'} transportista. Revisa los datos y la conexión.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="p-4" style={{ maxWidth: '800px' }}>
      <div className="tc-card">
        <h4 className="fw-bold mb-4 text-tc-blue border-bottom pb-3">{isEditing ? 'Editar Transportista' : 'Registro de Transportista'}</h4>
        
        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg('')} dismissible><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</Alert>}
        {successMsg && <Alert variant="success"><i className="bi bi-check-circle-fill me-2"></i>{successMsg}</Alert>}

        <Form onSubmit={handleSubmit}>
          <h6 className="fw-bold text-tc-orange mb-3">1. Datos Personales</h6>
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-person"></i>
                <Form.Control type="text" placeholder="Nombres" className="custom-input" required 
                  value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-person"></i>
                <Form.Control type="text" placeholder="Apellidos" className="custom-input" required 
                  value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-card-heading"></i>
                <Form.Control type="text" placeholder="Cédula (10 dígitos)" className="custom-input" required maxLength={10}
                  value={formData.cedula} onChange={handleCedulaChange} disabled={isEditing} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-telephone"></i>
                <Form.Control type="text" placeholder="Teléfono" className="custom-input" required 
                  value={formData.telefono} onChange={handleTelefonoChange} />
              </div>
            </div>
            <div className="col-md-12 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-envelope"></i>
                <Form.Control type="email" placeholder="Correo Electrónico" className="custom-input" required 
                  value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
              </div>
            </div>
            <div className="col-md-8 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-geo-alt"></i>
                <Form.Control type="text" placeholder="Dirección de Residencia" className="custom-input" required 
                  value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              </div>
            </div>
            {isEditing && (
              <div className="col-md-4 mb-3">
                <div className="input-icon-wrapper">
                  <i className="bi bi-toggle-on text-tc-orange"></i>
                  <Form.Select className="custom-input fw-bold" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </Form.Select>
                </div>
              </div>
            )}
          </div>

          <h6 className="fw-bold text-tc-orange mb-3 mt-5">2. Datos del Vehículo</h6>
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-truck"></i>
                <Form.Select className="custom-input" value={vehiculo.tipo} onChange={e => setVehiculo({...vehiculo, tipo: e.target.value})}>
                  <option value="">Tipo de Vehículo...</option>
                  <option value="Camión Sencillo">Camión Sencillo</option>
                  <option value="Tractocamión (Mula)">Tractocamión (Mula)</option>
                  <option value="Furgón">Furgón</option>
                </Form.Select>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="input-icon-wrapper">
                <i className="bi bi-123"></i>
                <Form.Control type="text" placeholder="Placa del Vehículo" className="custom-input" 
                  value={vehiculo.placa} onChange={e => setVehiculo({...vehiculo, placa: e.target.value})} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <Form.Control type="text" placeholder="Marca" className="custom-input" 
                value={vehiculo.marca} onChange={e => setVehiculo({...vehiculo, marca: e.target.value})} />
            </div>
            <div className="col-md-6 mb-3">
              <Form.Control type="number" placeholder="Año" className="custom-input" 
                value={vehiculo.anio} onChange={e => setVehiculo({...vehiculo, anio: e.target.value})} />
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end border-top pt-4">
            <button type="button" className="btn-tc-outline" onClick={() => navigate('/transportistas')}>
              Cancelar
            </button>
            <button type="submit" className="btn-tc-primary" disabled={loading}>
              <i className={isEditing ? "bi bi-save-fill me-2" : "bi bi-person-check-fill me-2"}></i> 
              {loading ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Registrar Transportista'}
            </button>
          </div>
        </Form>
      </div>
    </Container>
  );
}
