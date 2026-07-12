import { useState, useEffect } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function CrearViaje() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origen: '', destino: '', tipoMercancia: '', pesoCarga: '', contenedor: '', observaciones: '', transportistaId: '', criterio: 'rapida', fechaProgramada: ''
  });
  const [transportistas, setTransportistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchTransportistas = async () => {
      try {
        const response = await api.get('/transportistas');
        // Solo mostrar activos
        setTransportistas(response.data.filter((t: any) => t.estado === 'Activo'));
      } catch (error) {
        console.error('Error fetching transportistas:', error);
      }
    };
    fetchTransportistas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        pesoCarga: parseFloat(formData.pesoCarga)
      };
      await api.post('/viajes', payload);
      setSuccessMsg('Ruta creada exitosamente. Redirigiendo...');
      setTimeout(() => navigate('/viajes'), 1500);
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        let errData = error.response.data.error;
        if (typeof errData === 'string' && (errData.trim().startsWith('[') || errData.trim().startsWith('{'))) {
          try {
            errData = JSON.parse(errData);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
        if (Array.isArray(errData)) {
          setErrorMsg(errData.map((e: any) => e.message || JSON.stringify(e)).join(' | '));
        } else if (typeof errData === 'object' && errData !== null && errData.message) {
          setErrorMsg(errData.message);
        } else {
          setErrorMsg(typeof errData === 'string' ? errData : JSON.stringify(errData));
        }
      } else {
        setErrorMsg('Error al crear el viaje. Verifica los datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="p-4" style={{ maxWidth: '800px' }}>
      <div className="tc-card">
        <h4 className="fw-bold mb-4 text-tc-blue border-bottom pb-3">Planificar Nuevo Viaje</h4>
        
        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg('')} dismissible><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</Alert>}
        {successMsg && <Alert variant="success"><i className="bi bi-check-circle-fill me-2"></i>{successMsg}</Alert>}

        <Form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-bold text-muted">Ciudad de Origen</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-geo-alt-fill text-tc-primary"></i>
                <Form.Control type="text" placeholder="Ej: Quito" className="custom-input" required
                  value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} />
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <label className="form-label small fw-bold text-muted">Ciudad de Destino</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-geo-alt text-tc-orange"></i>
                <Form.Control type="text" placeholder="Ej: Guayaquil" className="custom-input" required
                  value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-bold text-muted">Tipo de Mercancía</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-box-seam text-tc-blue"></i>
                <Form.Select className="custom-input" required
                  value={formData.tipoMercancia} onChange={e => setFormData({...formData, tipoMercancia: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  <option value="Alimentos Perecederos">Alimentos Perecederos</option>
                  <option value="Electrodomésticos">Electrodomésticos</option>
                  <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                  <option value="Materiales Construcción">Materiales Construcción</option>
                </Form.Select>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <label className="form-label small fw-bold text-muted">Peso de Carga (Toneladas)</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-speedometer2 text-tc-blue"></i>
                <Form.Control type="number" step="0.1" placeholder="Ej: 15.5" className="custom-input" required
                  value={formData.pesoCarga} onChange={e => setFormData({...formData, pesoCarga: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 mb-4">
              <label className="form-label small fw-bold text-muted">Asignar Transportista (Opcional)</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-person-badge text-tc-blue"></i>
                <Form.Select className="custom-input" value={formData.transportistaId} onChange={e => setFormData({...formData, transportistaId: e.target.value})}>
                  <option value="">Dejar pendiente (Sin asignar)</option>
                  {transportistas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombres} {t.apellidos} - Cédula: {t.cedula} - {t.vehiculo?.tipo || 'Transportista'}</option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <label className="form-label small fw-bold text-muted">Criterio de Optimización de Ruta (Patrón Strategy)</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-compass text-tc-orange"></i>
                <Form.Select className="custom-input" required
                  value={formData.criterio} onChange={e => setFormData({...formData, criterio: e.target.value})}>
                  <option value="rapida">Ruta Más Rápida (Estrategia Rápida)</option>
                  <option value="segura">Ruta Más Segura (Estrategia Segura)</option>
                  <option value="corta">Ruta Menor Distancia (Estrategia Corta)</option>
                </Form.Select>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <label className="form-label small fw-bold text-muted">Fecha Programada del Viaje</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-calendar-event text-tc-blue"></i>
                <Form.Control type="date" className="custom-input" required
                  value={formData.fechaProgramada} onChange={e => setFormData({...formData, fechaProgramada: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="form-label small fw-bold text-muted">Observaciones Adicionales</label>
            <Form.Control as="textarea" rows={3} placeholder="Instrucciones especiales para el transportista..." className="custom-input p-3" 
              value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
          </div>

          <div className="d-flex gap-3 justify-content-end border-top pt-4">
            <button type="button" className="btn-tc-outline" onClick={() => navigate('/viajes')}>
              Cancelar
            </button>
            <button type="submit" className="btn-tc-primary" disabled={loading}>
              <i className="bi bi-check-circle me-2"></i> {loading ? 'Creando...' : 'Crear Viaje'}
            </button>
          </div>
        </Form>
      </div>
    </Container>
  );
}
