import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const originIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #10B981;
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 15px rgba(16,185,129,0.6);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #EF4444;
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 15px rgba(239,68,68,0.6);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #F26A21;
    width: 42px; height: 42px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(242,106,33,0.4), 0 6px 20px rgba(242,106,33,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    animation: pulse-truck 2s ease-in-out infinite;
  ">🚚</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

interface Vehicle {
  tipo: string;
  placa: string;
  marca: string;
  anio: number;
}

interface Transportista {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  vehiculo?: Vehicle | null;
}

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  pesoCarga: number;
  tipoMercancia: string;
  contenedor?: string;
  observaciones?: string;
  estado: string;
  transportista?: Transportista | null;
}

// Coordenadas reales de ciudades ecuatorianas
const CITY_GEO: { [key: string]: [number, number] } = {
  Quito:        [-0.1807, -78.4678],
  Guayaquil:    [-2.1894, -79.8890],
  Cuenca:       [-2.9001, -79.0059],
  Ambato:       [-1.2491, -78.6272],
  Riobamba:     [-1.6709, -78.6471],
  Manta:        [-0.9677, -80.7089],
  SantoDomingo: [-0.2530, -79.1754],
  Esmeraldas:   [ 0.9682, -79.6517],
  Loja:         [-3.9931, -79.2042],
  Machala:      [-3.2581, -79.9554],
  Ibarra:       [ 0.3516, -78.1222],
  Latacunga:    [-0.9316, -78.6148],
};

// Rutas intermedias para el polyline (waypoints reales)
const ROUTE_WAYPOINTS: { [key: string]: [number, number][] } = {
  'Quito-Guayaquil': [
    [-0.1807, -78.4678],
    [-0.2530, -79.1754], // Santo Domingo
    [-1.0225, -79.4600], // Quevedo
    [-2.1894, -79.8890],
  ],
  'Guayaquil-Quito': [
    [-2.1894, -79.8890],
    [-1.0225, -79.4600],
    [-0.2530, -79.1754],
    [-0.1807, -78.4678],
  ],
  'Quito-Cuenca': [
    [-0.1807, -78.4678],
    [-1.2491, -78.6272], // Ambato
    [-1.6709, -78.6471], // Riobamba
    [-2.9001, -79.0059],
  ],
  'Cuenca-Quito': [
    [-2.9001, -79.0059],
    [-1.6709, -78.6471],
    [-1.2491, -78.6272],
    [-0.1807, -78.4678],
  ],
  'Quito-Ambato': [
    [-0.1807, -78.4678],
    [-0.9316, -78.6148], // Latacunga
    [-1.2491, -78.6272],
  ],
  'Ambato-Quito': [
    [-1.2491, -78.6272],
    [-0.9316, -78.6148],
    [-0.1807, -78.4678],
  ],
  'Cuenca-Ambato': [
    [-2.9001, -79.0059],
    [-1.6709, -78.6471], // Riobamba
    [-1.2491, -78.6272],
  ],
  'Ambato-Cuenca': [
    [-1.2491, -78.6272],
    [-1.6709, -78.6471],
    [-2.9001, -79.0059],
  ],
  'Cuenca-Guayaquil': [
    [-2.9001, -79.0059],
    [-2.6833, -79.4667], // Naranjal
    [-2.1894, -79.8890],
  ],
  'Guayaquil-Cuenca': [
    [-2.1894, -79.8890],
    [-2.6833, -79.4667],
    [-2.9001, -79.0059],
  ],
};

const fallbackViajes: Viaje[] = [
  {
    id: 'f1',
    origen: 'Quito',
    destino: 'Guayaquil',
    pesoCarga: 15,
    tipoMercancia: 'Alimentos Perecederos',
    contenedor: 'MSCU8392019',
    observaciones: 'Mantener refrigerado a 4°C',
    estado: 'EnCurso',
    transportista: {
      id: 'd1',
      nombres: 'Luis Fernando',
      apellidos: 'Mendoza',
      telefono: '0991234567',
      vehiculo: { tipo: 'Camión Sencillo', placa: 'PBA-1234', marca: 'Chevrolet', anio: 2022 },
    },
  },
  {
    id: 'f2',
    origen: 'Cuenca',
    destino: 'Ambato',
    pesoCarga: 8.5,
    tipoMercancia: 'Materiales Construcción',
    contenedor: 'TOLU7483920',
    observaciones: 'Entregar en obra norte',
    estado: 'EnCurso',
    transportista: {
      id: 'd2',
      nombres: 'Carlos',
      apellidos: 'Zambrano',
      telefono: '0987654321',
      vehiculo: { tipo: 'Furgón', placa: 'GBA-4567', marca: 'Hino', anio: 2020 },
    },
  },
];

// Interpola posición a lo largo de waypoints
function interpolateAlongRoute(waypoints: [number, number][], t: number): [number, number] {
  if (waypoints.length === 0) return [0, 0];
  if (waypoints.length === 1) return waypoints[0];
  if (t <= 0) return waypoints[0];
  if (t >= 1) return waypoints[waypoints.length - 1];

  const totalSegments = waypoints.length - 1;
  const segW = 1 / totalSegments;
  const segIdx = Math.min(Math.floor(t / segW), totalSegments - 1);
  const segT = (t - segIdx * segW) / segW;

  const [lat1, lng1] = waypoints[segIdx];
  const [lat2, lng2] = waypoints[segIdx + 1];
  return [lat1 + (lat2 - lat1) * segT, lng1 + (lng2 - lng1) * segT];
}

// Componente que centra y ajusta el mapa a los waypoints
function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

export function Monitoreo() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [selectedViajeId, setSelectedViajeId] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(70);
  const [events, setEvents] = useState<string[]>([]);
  const [isDriver, setIsDriver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const role = currentUser?.rol?.toLowerCase() || '';
        setIsDriver(role === 'transportista');

        const tripsRes = await api.get('/viajes');
        const driversRes = await api.get('/transportistas');
        const drivers = driversRes.data;

        let trips = tripsRes.data
          .filter((v: any) => v.estado !== 'Finalizado' && v.estado !== 'Cancelado')
          .map((v: any) => {
            const driver = drivers.find((d: any) => d.id === v.transportistaId);
            return { ...v, transportista: driver || null };
          });

        if (role === 'transportista' && currentUser) {
          const matched = drivers.find(
            (d: any) => d.cedula === currentUser.cedula || d.correo === currentUser.correo
          );
          trips = matched ? trips.filter((v: any) => v.transportistaId === matched.id) : [];
        }

        if (trips.length === 0) {
          setViajes(fallbackViajes);
          setSelectedViajeId(fallbackViajes[0].id);
        } else {
          setViajes(trips);
          setSelectedViajeId(trips[0].id);
        }
      } catch {
        setViajes(fallbackViajes);
        setSelectedViajeId(fallbackViajes[0].id);
      }
    };
    fetchData();
  }, []);

  const activeViaje = viajes.find(v => v.id === selectedViajeId) || viajes[0];

  // Simulación de movimiento
  useEffect(() => {
    if (!activeViaje) return;
    setProgress(0);
    setSpeed(Math.floor(Math.random() * 20) + 65);
    setEvents([
      `[${new Date().toLocaleTimeString()}] Iniciando GPS – ${activeViaje.transportista?.vehiculo?.placa || 'SIN PLACA'}`,
      `[${new Date(Date.now() - 600000).toLocaleTimeString()}] Salida desde terminal en ${activeViaje.origen}`,
      `[${new Date(Date.now() - 300000).toLocaleTimeString()}] Conexión satelital establecida.`,
    ]);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        setSpeed(s => Math.max(40, Math.min(95, s + (Math.random() * 10 - 5))));
        const next = prev + 0.5;
        if (Math.round(next) === 25) setEvents(e => [`[${new Date().toLocaleTimeString()}] Paso por peaje intermedio.`, ...e]);
        if (Math.round(next) === 50) setEvents(e => [`[${new Date().toLocaleTimeString()}] Motor OK – carga estable.`, ...e]);
        if (Math.round(next) === 75) setEvents(e => [`[${new Date().toLocaleTimeString()}] Aproximándose a destino.`, ...e]);
        if (Math.round(next) === 99) setEvents(e => [`[${new Date().toLocaleTimeString()}] Llegada a ${activeViaje.destino}.`, ...e]);
        return next;
      });
    }, 600);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedViajeId, activeViaje?.id]);

  if (!activeViaje) {
    return (
      <Container className="p-4 text-center">
        <h5 className="text-muted">No tienes viajes activos asignados para monitorear.</h5>
      </Container>
    );
  }

  const routeKey = `${activeViaje.origen}-${activeViaje.destino}`;
  const waypoints: [number, number][] = ROUTE_WAYPOINTS[routeKey] || [
    CITY_GEO[activeViaje.origen] || [-0.18, -78.47],
    CITY_GEO[activeViaje.destino] || [-2.19, -79.89],
  ];

  const originCoords: [number, number] = CITY_GEO[activeViaje.origen] || [-0.18, -78.47];
  const destCoords: [number, number] = CITY_GEO[activeViaje.destino] || [-2.19, -79.89];
  const truckPos = interpolateAlongRoute(waypoints, progress / 100);
  const remainingHours = ((100 - progress) * 0.06).toFixed(1);

  // Porcentaje recorrido para la línea del camión
  const traveledSegmentCount = Math.floor((progress / 100) * (waypoints.length - 1));
  const traveledWaypoints: [number, number][] = [
    ...waypoints.slice(0, traveledSegmentCount + 1),
    truckPos,
  ];

  return (
    <Container fluid className="p-3 p-md-4" style={{ maxWidth: '1200px' }}>
      <style>{`
        @keyframes pulse-truck {
          0%, 100% { box-shadow: 0 0 0 4px rgba(242,106,33,0.4), 0 6px 20px rgba(242,106,33,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(242,106,33,0.1), 0 6px 20px rgba(242,106,33,0.3); }
        }
        .events-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .events-header {
          background: linear-gradient(135deg, #f1f5f9, #e8edf5);
          border-bottom: 1px solid #e2e8f0;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .events-body {
          max-height: 180px;
          overflow-y: auto;
          padding: 8px 12px;
        }
        .events-body::-webkit-scrollbar { width: 4px; }
        .events-body::-webkit-scrollbar-track { background: #f8fafc; }
        .events-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .event-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 8px;
          margin-bottom: 4px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          font-size: 0.76rem;
          animation: fadeSlideIn 0.3s ease;
          transition: background 0.15s;
        }
        .event-row:hover { background: #f0f9ff; border-color: #bae6fd; }
        .event-row:last-child { margin-bottom: 0; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .event-icon {
          width: 20px; height: 20px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; flex-shrink: 0; margin-top: 1px; font-weight: 700;
        }
        .event-time {
          color: #6366f1;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: 'Courier New', monospace;
          font-size: 0.72rem;
        }
        .event-msg { color: #374151; line-height: 1.4; font-size: 0.76rem; }
        .stat-card {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px;
          transition: transform 0.2s ease;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .map-wrapper {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.08);
          height: 460px;
        }
        .map-wrapper .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 16px;
        }
        .route-badge {
          background: linear-gradient(90deg, #10B981, #059669);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.3px;
        }
        .origin-label {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ecfdf5; color: #065f46;
          padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.82rem;
          border: 1px solid #a7f3d0;
        }
        .dest-label {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fef2f2; color: #991b1b;
          padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.82rem;
          border: 1px solid #fca5a5;
        }
        .progress-track {
          background: #e2e8f0;
          border-radius: 6px;
          height: 10px;
          overflow: hidden;
          position: relative;
        }
        .progress-fill {
          height: 100%;
          border-radius: 6px;
          background: linear-gradient(90deg, #f59e0b, #f26a21);
          transition: width 0.4s ease;
          position: relative;
        }
        .progress-fill::after {
          content: '';
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 20px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5));
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Header */}
      <div className="tc-card mb-4">
        <Row className="align-items-center g-3">
          <Col md={6}>
            <h5 className="fw-bold text-tc-blue m-0">
              <i className="bi bi-broadcast me-2" style={{ color: '#f26a21' }}></i>
              Centro de Monitoreo en Tiempo Real
            </h5>
            <p className="text-muted small m-0 mt-1">
              {isDriver ? 'Monitoreo satelital de tu viaje asignado' : 'Visualización de flota activa con mapa interactivo'}
            </p>
          </Col>
          <Col md={6}>
            <Form.Group className="d-flex align-items-center gap-2">
              <label className="text-muted small fw-bold text-nowrap">
                <i className="bi bi-truck me-1"></i> Viaje:
              </label>
              <Form.Select
                className="custom-input"
                value={selectedViajeId}
                onChange={e => setSelectedViajeId(e.target.value)}
                disabled={isDriver && viajes.length <= 1}
              >
                {viajes.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.origen} → {v.destino} | {v.transportista?.vehiculo?.placa || 'Sin Placa'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Ruta destacada */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <span className="origin-label">
          <i className="bi bi-circle-fill" style={{ color: '#10B981', fontSize: '8px' }}></i>
          ORIGEN: {activeViaje.origen}
        </span>
        <i className="bi bi-arrow-right text-muted"></i>
        <span className="dest-label">
          <i className="bi bi-geo-alt-fill" style={{ color: '#EF4444', fontSize: '12px' }}></i>
          DESTINO: {activeViaje.destino}
        </span>
        <Badge className="ms-auto" style={{
          background: 'linear-gradient(90deg,#f59e0b,#f26a21)',
          padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem'
        }}>
          <i className="bi bi-broadcast me-1"></i> EN TRÁNSITO — {progress.toFixed(0)}%
        </Badge>
      </div>

      <Row className="g-4">
        {/* Mapa Leaflet */}
        <Col lg={7}>
          <div className="map-wrapper">
            <MapContainer
              center={originCoords}
              zoom={7}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Ajustar vista a la ruta */}
              <FitRoute positions={waypoints} />

              {/* Ruta completa (gris tenue) */}
              <Polyline
                positions={waypoints}
                pathOptions={{
                  color: '#94a3b8',
                  weight: 5,
                  opacity: 0.4,
                  dashArray: '10, 8',
                }}
              />

              {/* Tramo recorrido (naranja brillante) */}
              <Polyline
                positions={traveledWaypoints}
                pathOptions={{
                  color: '#f26a21',
                  weight: 6,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Marcador ORIGEN */}
              <Marker position={originCoords} icon={originIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: '140px' }}>
                    <strong style={{ color: '#10B981' }}>📍 ORIGEN</strong>
                    <br />
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeViaje.origen}</span>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {originCoords[0].toFixed(4)}, {originCoords[1].toFixed(4)}
                    </small>
                  </div>
                </Popup>
              </Marker>

              {/* Marcador DESTINO */}
              <Marker position={destCoords} icon={destIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: '140px' }}>
                    <strong style={{ color: '#EF4444' }}>🏁 DESTINO</strong>
                    <br />
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeViaje.destino}</span>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {destCoords[0].toFixed(4)}, {destCoords[1].toFixed(4)}
                    </small>
                  </div>
                </Popup>
              </Marker>

              {/* Marcador CAMIÓN animado */}
              <Marker position={truckPos} icon={truckIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
                    <strong style={{ color: '#f26a21' }}>🚚 Posición actual</strong>
                    <br />
                    <span style={{ fontWeight: 700 }}>
                      {activeViaje.transportista?.vehiculo?.placa || 'SIN PLACA'}
                    </span>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {truckPos[0].toFixed(5)}, {truckPos[1].toFixed(5)}
                    </small>
                    <br />
                    <small><b>Velocidad:</b> {speed.toFixed(0)} km/h</small>
                    <br />
                    <small><b>Progreso:</b> {progress.toFixed(0)}%</small>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </Col>

        {/* Panel telemétrico */}
        <Col lg={5}>
          <div className="tc-card h-100 d-flex flex-column p-4" style={{ minHeight: '460px', gap: '1rem' }}>

            {/* Estado + ID */}
            <div className="d-flex justify-content-between align-items-center">
              <span className="route-badge">
                <i className="bi bi-broadcast me-1"></i> EN TRÁNSITO
              </span>
              <span className="text-muted small fw-bold" style={{ fontFamily: 'monospace' }}>
                #{activeViaje.id.substring(0, 8)}
              </span>
            </div>

            {/* Ruta */}
            <div>
              <p className="text-muted small fw-bold mb-1">RUTA</p>
              <h5 className="fw-bold text-tc-blue mb-0">
                {activeViaje.origen}
                <i className="bi bi-arrow-right mx-2 text-tc-orange"></i>
                {activeViaje.destino}
              </h5>
            </div>

            {/* Progreso */}
            <div>
              <div className="d-flex justify-content-between mb-1">
                <label className="text-muted small fw-bold">Progreso de ruta</label>
                <span className="text-tc-orange fw-bold small">{progress.toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Stats */}
            <Row className="g-2">
              <Col xs={6}>
                <div className="stat-card">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>VELOCIDAD</span>
                  <strong className="text-tc-blue" style={{ fontSize: '1.4rem' }}>{speed.toFixed(0)}</strong>
                  <span className="text-muted small ms-1">km/h</span>
                </div>
              </Col>
              <Col xs={6}>
                <div className="stat-card">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>ETA DESTINO</span>
                  <strong className="text-tc-blue" style={{ fontSize: '1.4rem' }}>{remainingHours}</strong>
                  <span className="text-muted small ms-1">horas</span>
                </div>
              </Col>
              <Col xs={12}>
                <div className="stat-card" style={{ fontFamily: 'Courier New, monospace' }}>
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>GPS (WGS84)</span>
                  <strong className="text-tc-blue small">
                    {truckPos[0].toFixed(6)}°, {truckPos[1].toFixed(6)}°
                  </strong>
                </div>
              </Col>
            </Row>

            {/* Info conductor y carga */}
            <div className="small border-top pt-3" style={{ lineHeight: '1.8' }}>
              <div className="d-flex gap-2 mb-1">
                <i className="bi bi-person-fill text-tc-orange mt-1"></i>
                <span>
                  <strong>Conductor: </strong>
                  {activeViaje.transportista
                    ? `${activeViaje.transportista.nombres} ${activeViaje.transportista.apellidos}`
                    : 'No asignado'}
                </span>
              </div>
              <div className="d-flex gap-2 mb-1">
                <i className="bi bi-telephone-fill text-tc-orange mt-1"></i>
                <span><strong>Teléfono: </strong>{activeViaje.transportista?.telefono || 'N/A'}</span>
              </div>
              <div className="d-flex gap-2 mb-1">
                <i className="bi bi-truck text-tc-orange mt-1"></i>
                <span>
                  <strong>Vehículo: </strong>
                  {activeViaje.transportista?.vehiculo
                    ? `${activeViaje.transportista.vehiculo.marca} ${activeViaje.transportista.vehiculo.placa} (${activeViaje.transportista.vehiculo.tipo})`
                    : 'N/A'}
                </span>
              </div>
              <div className="d-flex gap-2 mb-1">
                <i className="bi bi-box-seam text-tc-orange mt-1"></i>
                <span>
                  <strong>Carga: </strong>
                  {activeViaje.tipoMercancia} — {activeViaje.pesoCarga} Ton.
                </span>
              </div>
              {activeViaje.contenedor && (
                <div className="d-flex gap-2 mb-0">
                  <i className="bi bi-upc-scan text-tc-orange mt-1"></i>
                  <span><strong>Contenedor: </strong>{activeViaje.contenedor}</span>
                </div>
              )}
            </div>

            {/* Bitácora mejorada */}
            <div className="mt-auto">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  animation: 'pulse-truck 1.5s ease-in-out infinite',
                }} />
                <span className="text-muted fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Bitácora de Eventos
                </span>
                <span style={{
                  marginLeft: 'auto',
                  background: '#0d1117',
                  border: '1px solid #21262d',
                  borderRadius: '20px',
                  padding: '1px 8px',
                  fontSize: '0.68rem',
                  color: '#58a6ff',
                  fontFamily: 'monospace',
                }}>
                  {events.length} registros
                </span>
              </div>

              <div className="events-panel">
                {/* Cabecera limpia */}
                <div className="events-header">
                  <i className="bi bi-clock-history" style={{ color: '#6366f1', fontSize: '0.85rem' }}></i>
                  <span style={{ color: '#374151', fontSize: '0.76rem', fontWeight: 700 }}>Registro de actividad</span>
                  <span style={{
                    marginLeft: 'auto', background: '#ede9fe', color: '#6366f1',
                    borderRadius: '20px', padding: '1px 9px', fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    {events.length} eventos
                  </span>
                </div>

                <div className="events-body">
                  {events.map((ev, i) => {
                    // Determinar tipo de evento para colorear
                    const isAlert   = ev.toLowerCase().includes('peaje') || ev.toLowerCase().includes('reporte');
                    const isSuccess = ev.toLowerCase().includes('llegada') || ev.toLowerCase().includes('conexión');
                    const isStart   = ev.toLowerCase().includes('salida') || ev.toLowerCase().includes('iniciando');

                    const iconColor = isSuccess ? '#10B981' : isAlert ? '#F59E0B' : isStart ? '#58a6ff' : '#6e7681';
                    const iconBg    = isSuccess ? 'rgba(16,185,129,0.15)' : isAlert ? 'rgba(245,158,11,0.15)' : isStart ? 'rgba(88,166,255,0.15)' : 'rgba(110,118,129,0.15)';
                    const icon      = isSuccess ? '✓' : isAlert ? '!' : isStart ? '▶' : '·';

                    // Separar timestamp del mensaje
                    const timeMatch = ev.match(/\[(.+?)\]/);
                    const timeStr   = timeMatch ? timeMatch[1] : '';
                    const msgStr    = ev.replace(/\[.+?\]\s*/, '');

                    return (
                      <div key={i} className="event-row">
                        <div className="event-icon" style={{ background: iconBg, color: iconColor }}>
                          {icon}
                        </div>
                        <span className="event-time">[{timeStr}]</span>
                        <span className="event-msg">{msgStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
