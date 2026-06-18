import { Container } from 'react-bootstrap';

export function Monitoreo() {
  return (
    <Container className="p-3">
      <div className="bg-light rounded d-flex flex-column align-items-center justify-content-center mb-4" style={{ height: '400px', border: '1px solid #e0e0e0', background: 'linear-gradient(rgba(244, 247, 251, 0.8), rgba(244, 247, 251, 0.8)), url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Relief_Map_of_Ecuador.jpg/800px-Relief_Map_of_Ecuador.jpg") center/cover' }}>
        <i className="bi bi-geo-alt-fill text-danger" style={{ fontSize: '3rem', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}></i>
        <div className="fw-bold text-tc-blue mt-2 p-2 bg-white rounded shadow-sm">Rastreo Activo en Ruta Troncal</div>
        <div className="small bg-dark text-white px-3 py-1 rounded mt-2">Lat: -0.1806, Lng: -78.4678 (Quito, Ecuador)</div>
      </div>

      <h6 className="fw-bold mb-3">Información del Viaje</h6>
      <div className="tc-card p-4">
        <p className="mb-2"><span className="text-muted fw-bold me-2">Ruta Asignada:</span> Quito <i className="bi bi-arrow-right mx-1"></i> Guayaquil</p>
        <p className="mb-2"><span className="text-muted fw-bold me-2">Transportista:</span> Luis Fernando Mendoza</p>
        <p className="mb-0"><span className="text-muted fw-bold me-2">Estado:</span> <span className="badge bg-warning text-dark">En Tránsito (Vía Alóag - Santo Domingo)</span></p>
      </div>
    </Container>
  );
}
