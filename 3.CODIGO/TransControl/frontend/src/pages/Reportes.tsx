import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Badge, Form, Button, Table, Modal } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';

/* ─── Fix Leaflet icon paths ─────────────────────────────────── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ─── Icons ──────────────────────────────────────────────────── */
const makePin = (color: string, label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color}; width:36px; height:36px;
      border-radius:50% 50% 50% 0; transform:rotate(-45deg);
      border:3px solid #fff; box-shadow:0 4px 14px ${color}88;
      display:flex; align-items:center; justify-content:center; color:#fff;
      font-size:12px; font-weight:800;">
        <span style="transform:rotate(45deg)">${label}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

const truckDivIcon = (placa: string, color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color}; width:40px; height:40px;
      border-radius:50%; border:3px solid #fff;
      box-shadow:0 0 0 4px ${color}44, 0 4px 14px ${color}88;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; flex-direction:column; position:relative;">
      🚚
      <div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);
        background:#1e293b;color:#fff;font-size:7px;font-weight:700;
        padding:1px 5px;border-radius:4px;white-space:nowrap;">${placa}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const originPin = makePin('#10B981', 'A');
const destPin   = makePin('#EF4444', 'B');

/* ─── Geodata ────────────────────────────────────────────────── */
const CITY_GEO: { [k: string]: [number, number] } = {
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

const ROUTE_WAYPOINTS: { [k: string]: [number, number][] } = {
  'Quito-Guayaquil':   [[-0.1807,-78.4678],[-0.2530,-79.1754],[-1.0225,-79.4600],[-2.1894,-79.8890]],
  'Guayaquil-Quito':   [[-2.1894,-79.8890],[-1.0225,-79.4600],[-0.2530,-79.1754],[-0.1807,-78.4678]],
  'Quito-Cuenca':      [[-0.1807,-78.4678],[-1.2491,-78.6272],[-1.6709,-78.6471],[-2.9001,-79.0059]],
  'Cuenca-Quito':      [[-2.9001,-79.0059],[-1.6709,-78.6471],[-1.2491,-78.6272],[-0.1807,-78.4678]],
  'Quito-Ambato':      [[-0.1807,-78.4678],[-0.9316,-78.6148],[-1.2491,-78.6272]],
  'Ambato-Quito':      [[-1.2491,-78.6272],[-0.9316,-78.6148],[-0.1807,-78.4678]],
  'Cuenca-Ambato':     [[-2.9001,-79.0059],[-1.6709,-78.6471],[-1.2491,-78.6272]],
  'Ambato-Cuenca':     [[-1.2491,-78.6272],[-1.6709,-78.6471],[-2.9001,-79.0059]],
  'Cuenca-Guayaquil':  [[-2.9001,-79.0059],[-2.6833,-79.4667],[-2.1894,-79.8890]],
  'Guayaquil-Cuenca':  [[-2.1894,-79.8890],[-2.6833,-79.4667],[-2.9001,-79.0059]],
  'Guayaquil-Manta':   [[-2.1894,-79.8890],[-1.5000,-80.2000],[-0.9677,-80.7089]],
  'Manta-Guayaquil':   [[-0.9677,-80.7089],[-1.5000,-80.2000],[-2.1894,-79.8890]],
  'Quito-Ibarra':      [[-0.1807,-78.4678],[0.1500,-78.3500],[0.3516,-78.1222]],
  'Ibarra-Quito':      [[0.3516,-78.1222],[0.1500,-78.3500],[-0.1807,-78.4678]],
  'Guayaquil-Machala': [[-2.1894,-79.8890],[-2.9000,-79.9000],[-3.2581,-79.9554]],
  'Machala-Guayaquil': [[-3.2581,-79.9554],[-2.9000,-79.9000],[-2.1894,-79.8890]],
  'Quito-Riobamba':    [[-0.1807,-78.4678],[-1.2491,-78.6272],[-1.6709,-78.6471]],
  'Riobamba-Quito':    [[-1.6709,-78.6471],[-1.2491,-78.6272],[-0.1807,-78.4678]],
  'Quito-Manta':       [[-0.1807,-78.4678],[-0.2530,-79.1754],[-0.9677,-80.7089]],
  'Manta-Quito':       [[-0.9677,-80.7089],[-0.2530,-79.1754],[-0.1807,-78.4678]],
};

const ROUTE_DISTANCES: { [k: string]: number } = {
  'Quito-Guayaquil': 420,'Guayaquil-Quito': 420,
  'Quito-Cuenca': 460,   'Cuenca-Quito': 460,
  'Quito-Ambato': 135,   'Ambato-Quito': 135,
  'Cuenca-Ambato': 215,  'Ambato-Cuenca': 215,
  'Cuenca-Guayaquil': 195,'Guayaquil-Cuenca': 195,
  'Guayaquil-Manta': 190,'Manta-Guayaquil': 190,
  'Quito-Ibarra': 115,   'Ibarra-Quito': 115,
  'Guayaquil-Machala': 185,'Machala-Guayaquil': 185,
  'Quito-Riobamba': 210, 'Riobamba-Quito': 210,
  'Quito-Manta': 290,    'Manta-Quito': 290,
};

const CITIES = Object.keys(CITY_GEO);

const ROUTE_COLORS = [
  '#f26a21','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#84CC16'
];

/* ─── Helpers ────────────────────────────────────────────────── */
function haversineKm(a: [number,number], b: [number,number]) {
  const R = 6371, dLat=(b[0]-a[0])*Math.PI/180, dLng=(b[1]-a[1])*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

function getRouteInfo(origin: string, dest: string) {
  const key = `${origin}-${dest}`;
  const waypoints: [number,number][] = ROUTE_WAYPOINTS[key] || [
    CITY_GEO[origin] || [-0.18,-78.47], CITY_GEO[dest] || [-2.19,-79.89],
  ];
  const distKm = ROUTE_DISTANCES[key] || Math.round(haversineKm(waypoints[0], waypoints[waypoints.length-1])*1.35);
  const hours = distKm / 75;
  const totalFuel = Math.round((distKm/100)*28);
  const fuelCost = Math.round(totalFuel*0.55*100)/100;
  return { waypoints, distKm, hours, totalFuel, fuelCost };
}

function interpolate(wps: [number,number][], t: number): [number,number] {
  if (wps.length === 0) return [0,0];
  if (t <= 0) return wps[0];
  if (t >= 1) return wps[wps.length-1];
  const n = wps.length-1, segW = 1/n;
  const idx = Math.min(Math.floor(t/segW), n-1);
  const st = (t - idx*segW)/segW;
  return [wps[idx][0]+(wps[idx+1][0]-wps[idx][0])*st, wps[idx][1]+(wps[idx+1][1]-wps[idx][1])*st];
}

/* ─── FitBounds ──────────────────────────────────────────────── */
function FitBounds({ positions }: { positions: [number,number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) map.fitBounds(L.latLngBounds(positions), { padding:[55,55] });
  }, [positions, map]);
  return null;
}

/* ─── Mini Charts ────────────────────────────────────────────── */
function BarChart({ data }: { data: { label:string; value:number; color:string }[] }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', height:'120px' }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:d.color }}>{d.value}</span>
          <div style={{ width:'100%', height:`${(d.value/max)*90}px`, background:d.color, borderRadius:'6px 6px 0 0', minHeight:'4px', opacity:.85, transition:'height .6s' }}/>
          <span style={{ fontSize:'0.63rem', color:'#64748b', textAlign:'center', lineHeight:1.1 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments:{label:string;value:number;color:string}[] }) {
  const total = segments.reduce((s,d)=>s+d.value,0)||1;
  let offset = 0;
  const r=42,cx=55,cy=55,circ=2*Math.PI*r;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {segments.map((seg,i) => {
          const pct=seg.value/total, dash=pct*circ;
          const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="18"
            strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset*circ} style={{transition:'stroke-dasharray .6s'}}/>;
          offset+=pct; return el;
        })}
        <text x={cx} y={cy+5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">{total}</text>
        <text x={cx} y={cy+19} textAnchor="middle" fontSize="8" fill="#64748b">total</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {segments.map((seg,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.75rem' }}>
            <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:seg.color }}/>
            <span style={{ color:'#475569' }}>{seg.label}: <strong style={{ color:'#1e293b' }}>{seg.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PDF Generator ──────────────────────────────────────────── */
function generatePDF(viajes: any[], metrics: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString('es-EC');

  // Header background
  doc.setFillColor(10, 66, 117);
  doc.rect(0, 0, W, 38, 'F');

  // Logo placeholder
  doc.setFillColor(242, 106, 33);
  doc.roundedRect(12, 8, 22, 22, 4, 4, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('TC', 18, 22);

  // Title
  doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.setTextColor(255,255,255);
  doc.text('TransControl', 40, 18);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('Reporte Operativo de Viajes', 40, 27);

  // Date
  doc.setFontSize(8);
  doc.text(`Generado: ${now}`, W-14, 20, { align:'right' });

  // KPI boxes
  const kpis = [
    { label:'Total Viajes', value: String(metrics.total), color:[59,130,246] },
    { label:'Finalizados',  value: String(metrics.finalizados), color:[16,185,129] },
    { label:'En Tránsito',  value: String(metrics.enCurso), color:[245,158,11] },
    { label:'Cancelados',   value: String(metrics.cancelados), color:[239,68,68] },
    { label:'Toneladas',    value: `${metrics.totalTon}T`, color:[139,92,246] },
  ];
  const boxW = (W-24)/ kpis.length;
  kpis.forEach((k,i) => {
    const x = 12 + i*boxW, y = 44;
    doc.setFillColor(...(k.color as [number,number,number]));
    doc.setDrawColor(...(k.color as [number,number,number]));
    doc.roundedRect(x, y, boxW-4, 18, 3, 3, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text(k.value, x+(boxW-4)/2, y+9, { align:'center' });
    doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.text(k.label, x+(boxW-4)/2, y+15, { align:'center' });
  });

  // Top insight bar
  doc.setFillColor(248,250,252);
  doc.rect(12, 67, W-24, 14, 'F');
  doc.setDrawColor(226,232,240);
  doc.rect(12, 67, W-24, 14, 'S');
  doc.setTextColor(100,116,139);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  if (metrics.topRoute) doc.text(`📍 Ruta principal: ${metrics.topRoute[0]}  (${metrics.topRoute[1]} viajes)`, 18, 76);
  if (metrics.topMerc)  doc.text(`📦 Mercancía principal: ${metrics.topMerc[0]}`, W/2+6, 76);

  // Section title
  doc.setTextColor(10,66,117);
  doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('Historial de Viajes', 12, 92);
  doc.setDrawColor(242,106,33);
  doc.setLineWidth(0.8); doc.line(12, 94, 60, 94);

  // Table
  autoTable(doc, {
    startY: 98,
    head: [['#', 'Origen', 'Destino', 'Mercancía', 'Peso (T)', 'Estado']],
    body: viajes.map((v, i) => [i+1, v.origen, v.destino, v.tipoMercancia, v.pesoCarga, v.estado]),
    styles: { fontSize: 8.5, cellPadding: 3, font:'helvetica' },
    headStyles: { fillColor:[10,66,117], textColor:255, fontStyle:'bold', fontSize:8 },
    alternateRowStyles: { fillColor:[248,250,252] },
    columnStyles: {
      0:{ cellWidth:10, halign:'center', textColor:[100,116,139] },
      5:{ halign:'center', fontStyle:'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 5) {
        const v = data.cell.raw as string;
        if (v==='Finalizado') data.cell.styles.textColor=[16,185,129];
        else if (v==='Cancelado') data.cell.styles.textColor=[239,68,68];
        else if (v==='EnCurso'||v==='Asignado') data.cell.styles.textColor=[245,158,11];
        else data.cell.styles.textColor=[59,130,246];
      }
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p=1; p<=pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(10,66,117);
    doc.rect(0, doc.internal.pageSize.getHeight()-12, W, 12, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.text('TransControl — Sistema de Gestión de Transporte de Carga', W/2, doc.internal.pageSize.getHeight()-5, { align:'center' });
    doc.text(`Página ${p} de ${pageCount}`, W-14, doc.internal.pageSize.getHeight()-5, { align:'right' });
  }

  doc.save(`TransControl_Reporte_${new Date().toISOString().slice(0,10)}.pdf`);
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export function Reportes() {
  const [viajes, setViajes]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'reportes'|'planificacion'>('reportes');

  /* filtros */
  const [filterEstado, setFilterEstado]   = useState('');
  const [filterOrigen, setFilterOrigen]   = useState('');
  const [filterDestino, setFilterDestino] = useState('');

  /* modal edición */
  const [editViaje, setEditViaje]         = useState<any|null>(null);
  const [editOrigen, setEditOrigen]       = useState('');
  const [editDestino, setEditDestino]     = useState('');
  const [editWaypoints, setEditWaypoints] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  /* simulación progreso de viajes activos */
  const [progresses, setProgresses] = useState<{ [id:string]: number }>({});
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  /* viaje seleccionado en mapa planificación */
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/viajes');
        setViajes(res.data);
      } catch {
        setViajes([
          { id:'v1', origen:'Quito',     destino:'Guayaquil', estado:'Finalizado',  tipoMercancia:'Alimentos',     pesoCarga:12 },
          { id:'v2', origen:'Cuenca',    destino:'Ambato',    estado:'Finalizado',  tipoMercancia:'Construcción',  pesoCarga:20 },
          { id:'v3', origen:'Guayaquil', destino:'Cuenca',    estado:'EnCurso',     tipoMercancia:'Electrónicos',  pesoCarga:5  },
          { id:'v4', origen:'Ambato',    destino:'Quito',     estado:'Disponible',  tipoMercancia:'Farmacéuticos', pesoCarga:3  },
          { id:'v5', origen:'Quito',     destino:'Ibarra',    estado:'Finalizado',  tipoMercancia:'Textiles',      pesoCarga:8  },
          { id:'v6', origen:'Guayaquil', destino:'Machala',   estado:'Cancelado',   tipoMercancia:'Alimentos',     pesoCarga:14 },
          { id:'v7', origen:'Manta',     destino:'Guayaquil', estado:'Finalizado',  tipoMercancia:'Manufactura',   pesoCarga:18 },
          { id:'v8', origen:'Quito',     destino:'Cuenca',    estado:'Asignado',    tipoMercancia:'Farmacéuticos', pesoCarga:6  },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  /* Simulación de progreso para viajes activos */
  const activeTrips = viajes.filter(v => v.estado === 'EnCurso' || v.estado === 'Asignado');

  useEffect(() => {
    if (activeTrips.length === 0) return;
    const init: { [id:string]:number } = {};
    activeTrips.forEach(v => { init[v.id] = Math.floor(Math.random()*60)+10; });
    setProgresses(init);
    if (selectedTripId === '') setSelectedTripId(activeTrips[0].id);

    intervalRef.current = setInterval(() => {
      setProgresses(prev => {
        const next = { ...prev };
        activeTrips.forEach(v => { next[v.id] = next[v.id] >= 99 ? 5 : (next[v.id]||0) + 0.3; });
        return next;
      });
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [viajes.length]);

  /* ─── metrics ─────────────────────────────────── */
  const total       = viajes.length;
  const finalizados = viajes.filter(v=>v.estado==='Finalizado').length;
  const enCurso     = viajes.filter(v=>v.estado==='EnCurso'||v.estado==='Asignado').length;
  const disponibles = viajes.filter(v=>v.estado==='Disponible').length;
  const cancelados  = viajes.filter(v=>v.estado==='Cancelado').length;
  const totalTon    = viajes.reduce((s,v)=>s+(Number(v.pesoCarga)||0),0);

  const routeFreq: { [k:string]:number } = {};
  viajes.forEach(v => { const k=`${v.origen} → ${v.destino}`; routeFreq[k]=(routeFreq[k]||0)+1; });
  const topRoute = Object.entries(routeFreq).sort((a,b)=>b[1]-a[1])[0];

  const mercFreq: { [k:string]:number } = {};
  viajes.forEach(v => { mercFreq[v.tipoMercancia]=(mercFreq[v.tipoMercancia]||0)+1; });
  const topMerc = Object.entries(mercFreq).sort((a,b)=>b[1]-a[1])[0];

  const barData = [
    { label:'Finalizados', value:finalizados, color:'#10B981' },
    { label:'En Tránsito', value:enCurso,     color:'#F59E0B' },
    { label:'Disponibles', value:disponibles, color:'#3B82F6' },
    { label:'Cancelados',  value:cancelados,  color:'#EF4444' },
  ];

  const filtered = viajes.filter(v => {
    if (filterEstado  && v.estado !== filterEstado) return false;
    if (filterOrigen  && !v.origen?.toLowerCase().includes(filterOrigen.toLowerCase())) return false;
    if (filterDestino && !v.destino?.toLowerCase().includes(filterDestino.toLowerCase())) return false;
    return true;
  });

  /* ─── editar ruta ─────────────────────────────── */
  const handleEdit = (v: any) => {
    setEditViaje(v);
    setEditOrigen(v.origen);
    setEditDestino(v.destino);
    // Inicializar waypoints intermedios (sin origen ni destino)
    const key = `${v.origen}-${v.destino}`;
    const wps = ROUTE_WAYPOINTS[key] || [];
    // Extraer solo los índices intermedios (sin primer y último)
    const midCities = wps
      .slice(1, -1)
      .map(coord => {
        const entry = Object.entries(CITY_GEO).find(
          ([, c]) => Math.abs(c[0] - coord[0]) < 0.05 && Math.abs(c[1] - coord[1]) < 0.05
        );
        return entry ? entry[0] : null;
      })
      .filter(Boolean) as string[];
    setEditWaypoints(midCities);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editViaje) return;
    // Construir waypoints completos: origen + intermedios + destino
    const fullWps: [number, number][] = [
      CITY_GEO[editOrigen] || [-0.18, -78.47],
      ...editWaypoints.map(c => CITY_GEO[c]).filter(Boolean) as [number,number][],
      CITY_GEO[editDestino] || [-2.19, -79.89],
    ];
    const updated = {
      ...editViaje,
      origen: editOrigen,
      destino: editDestino,
      _customWaypoints: fullWps,
    };
    try { await api.put(`/viajes/${editViaje.id}`, updated); } catch { /* noop */ }
    setViajes(prev => prev.map(v => v.id === editViaje.id ? updated : v));
    setShowEditModal(false);
    setEditViaje(null);
  };

  /* ─── selected active trip for map ──────────── */
  const [planSearch, setPlanSearch]       = useState('');
  const [planFilterEstado, setPlanFilterEstado] = useState('');

  const selectedTrip = viajes.find(v => v.id === selectedTripId) || activeTrips[0] || viajes[0];
  const planWaypoints: [number,number][] = selectedTrip
    ? (selectedTrip._customWaypoints || getRouteInfo(selectedTrip.origen, selectedTrip.destino).waypoints)
    : [];
  const truckPos: [number,number] | null =
    selectedTrip &&
    (selectedTrip.estado === 'EnCurso' || selectedTrip.estado === 'Asignado') &&
    planWaypoints.length > 0
      ? interpolate(planWaypoints, (progresses[selectedTrip.id]||0)/100)
      : null;

  /* Status colors */
  const statusColor: { [k:string]:string } = {
    Finalizado:'#10B981', EnCurso:'#F59E0B', Asignado:'#F59E0B',
    Disponible:'#3B82F6', Cancelado:'#EF4444',
  };

  /* ─── render ──────────────────────────────── */
  return (
    <Container fluid className="p-3 p-md-4" style={{ maxWidth:'1200px' }}>
      <style>{`
        .rep-tab{padding:10px 22px;border-radius:30px;border:none;background:transparent;
          font-weight:600;font-size:.87rem;color:#64748b;cursor:pointer;transition:all .2s}
        .rep-tab.active{background:linear-gradient(135deg,#0a4275,#1565a8);color:#fff;
          box-shadow:0 4px 14px rgba(10,66,117,.3)}
        .rep-tab:hover:not(.active){background:#f1f5f9;color:#1e293b}

        .kpi-card{background:#fff;border-radius:16px;padding:18px 22px;border:1px solid #e2e8f0;
          box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .2s,box-shadow .2s}
        .kpi-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
        .kpi-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;
          justify-content:center;font-size:1.3rem;margin-bottom:10px}
        .kpi-value{font-size:1.9rem;font-weight:800;color:#1e293b;line-height:1}
        .kpi-label{font-size:.76rem;color:#64748b;font-weight:600;letter-spacing:.4px;margin-top:4px}

        .chart-card{background:#fff;border-radius:16px;padding:22px;
          border:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .chart-title{font-size:.8rem;font-weight:700;color:#64748b;
          text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px}

        .map-plan-wrapper{border-radius:16px;overflow:hidden;
          box-shadow:0 6px 30px rgba(0,0,0,.12);border:1px solid #e2e8f0;height:420px}
        .map-plan-wrapper .leaflet-container{height:100%;width:100%}

        .trip-selector-btn{border:2px solid #e2e8f0;border-radius:12px;padding:10px 14px;
          background:#fff;cursor:pointer;transition:all .2s;text-align:left;width:100%}
        .trip-selector-btn.active{border-color:#f26a21;background:#fff7ed;
          box-shadow:0 2px 12px rgba(242,106,33,.2)}
        .trip-selector-btn:hover:not(.active){border-color:#cbd5e1;background:#f8fafc}

        .rep-table th{background:#f1f5f9;font-size:.76rem;font-weight:700;color:#475569;
          text-transform:uppercase;letter-spacing:.4px;border:none}
        .rep-table td{font-size:.85rem;vertical-align:middle}
        .rep-table tr:hover td{background:#f8fafc}

        .pdf-btn{background:linear-gradient(135deg,#EF4444,#dc2626);
          color:#fff;border:none;border-radius:12px;padding:10px 22px;
          font-weight:700;font-size:.88rem;cursor:pointer;transition:all .2s;
          box-shadow:0 4px 14px rgba(239,68,68,.3);display:flex;align-items:center;gap:6px}
        .pdf-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(239,68,68,.4)}

        .edit-btn{background:linear-gradient(135deg,#f26a21,#f59e0b);
          color:#fff;border:none;border-radius:8px;padding:5px 12px;
          font-size:.77rem;font-weight:700;cursor:pointer;transition:all .2s}
        .edit-btn:hover{transform:scale(1.04)}

        .progress-mini{background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden}
        .progress-mini-fill{height:100%;border-radius:4px;
          background:linear-gradient(90deg,#f59e0b,#f26a21);transition:width .4s}
      `}</style>

      {/* Header */}
      <div className="tc-card mb-4">
        <Row className="align-items-center g-3">
          <Col>
            <h5 className="fw-bold text-tc-blue m-0">
              <i className="bi bi-bar-chart-fill me-2" style={{ color:'#f26a21' }}></i>
              Reportes y Planificación de Rutas
            </h5>
            <p className="text-muted small m-0 mt-1">Análisis operativo y gestión de rutas de viajes activos</p>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2 p-1" style={{ background:'#f1f5f9', borderRadius:'35px' }}>
              <button className={`rep-tab ${activeTab==='reportes'?'active':''}`} onClick={()=>setActiveTab('reportes')}>
                <i className="bi bi-bar-chart me-1"></i>Reportes
              </button>
              <button className={`rep-tab ${activeTab==='planificacion'?'active':''}`} onClick={()=>setActiveTab('planificacion')}>
                <i className="bi bi-map me-1"></i>Planificación
              </button>
            </div>
          </Col>
        </Row>
      </div>

      {/* ══════════ TAB: REPORTES ══════════ */}
      {activeTab==='reportes' && (
        <>
          {loading ? (
            <div className="text-center py-5 text-muted fw-bold">Cargando datos...</div>
          ) : (
            <>
              {/* KPI Cards */}
              <Row className="g-3 mb-4">
                {[
                  { label:'Total Viajes',   value:total,         color:'#3B82F6', bg:'rgba(59,130,246,.08)',  icon:'bi-collection-fill' },
                  { label:'Finalizados',    value:finalizados,   color:'#10B981', bg:'rgba(16,185,129,.08)', icon:'bi-check-circle-fill' },
                  { label:'En Tránsito',    value:enCurso,       color:'#F59E0B', bg:'rgba(245,158,11,.08)', icon:'bi-truck-front-fill' },
                  { label:'Cancelados',     value:cancelados,    color:'#EF4444', bg:'rgba(239,68,68,.08)',  icon:'bi-x-circle-fill' },
                  { label:'Ton. Totales',   value:`${totalTon}T`,color:'#8B5CF6', bg:'rgba(139,92,246,.08)', icon:'bi-box-seam-fill' },
                  { label:'Ruta Principal', value:topRoute?topRoute[0].split(' → ')[0]:'—', color:'#F26A21', bg:'rgba(242,106,33,.08)', icon:'bi-geo-alt-fill' },
                ].map((kpi,i)=>(
                  <Col key={i} md={4} sm={6} xs={6}>
                    <div className="kpi-card">
                      <div className="kpi-icon" style={{ background:kpi.bg, color:kpi.color }}>
                        <i className={`bi ${kpi.icon}`}></i>
                      </div>
                      <div className="kpi-value" style={{ color:kpi.color }}>{kpi.value}</div>
                      <div className="kpi-label">{kpi.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Charts */}
              <Row className="g-3 mb-4">
                <Col md={5}>
                  <div className="chart-card h-100">
                    <div className="chart-title"><i className="bi bi-pie-chart-fill me-1"></i>Distribución de Estados</div>
                    <DonutChart segments={[
                      { label:'Finalizado', value:finalizados, color:'#10B981' },
                      { label:'En Tránsito',value:enCurso,     color:'#F59E0B' },
                      { label:'Disponible', value:disponibles, color:'#3B82F6' },
                      { label:'Cancelado',  value:cancelados,  color:'#EF4444' },
                    ]}/>
                    {topMerc && (
                      <div className="mt-4 p-3" style={{ background:'#f8fafc', borderRadius:'10px' }}>
                        <div style={{ fontSize:'.72rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Mercancía más frecuente</div>
                        <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#1e293b', marginTop:'4px' }}>
                          {topMerc[0]} <span style={{ color:'#10B981', fontWeight:600, fontSize:'.83rem' }}>×{topMerc[1]} viajes</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={7}>
                  <div className="chart-card h-100">
                    <div className="chart-title"><i className="bi bi-bar-chart-line-fill me-1"></i>Viajes por Estado</div>
                    <BarChart data={barData}/>
                    {topRoute && (
                      <div className="mt-4 p-3" style={{ background:'#f8fafc', borderRadius:'10px' }}>
                        <div style={{ fontSize:'.72rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Ruta más operada</div>
                        <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#1e293b', marginTop:'4px' }}>
                          {topRoute[0]} <span style={{ color:'#F26A21', fontWeight:600, fontSize:'.83rem' }}>×{topRoute[1]} viajes</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Table + PDF */}
              <div className="chart-card">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="chart-title m-0"><i className="bi bi-table me-1"></i>Historial de Viajes</div>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <Form.Select size="sm" style={{ borderRadius:'8px', fontSize:'.82rem', width:'140px' }}
                      value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}>
                      <option value="">Todos los estados</option>
                      <option>Finalizado</option><option>EnCurso</option>
                      <option>Asignado</option><option>Disponible</option><option>Cancelado</option>
                    </Form.Select>
                    <Form.Control size="sm" placeholder="Origen..." style={{ borderRadius:'8px', fontSize:'.82rem', width:'100px' }}
                      value={filterOrigen} onChange={e=>setFilterOrigen(e.target.value)}/>
                    <Form.Control size="sm" placeholder="Destino..." style={{ borderRadius:'8px', fontSize:'.82rem', width:'100px' }}
                      value={filterDestino} onChange={e=>setFilterDestino(e.target.value)}/>

                    {/* ── BOTÓN PDF ── */}
                    <button className="pdf-btn" onClick={() => generatePDF(filtered, { total, finalizados, enCurso, cancelados, totalTon, topRoute, topMerc })}>
                      <i className="bi bi-file-earmark-pdf-fill"></i>
                      Exportar PDF
                    </button>
                  </div>
                </div>

                <div style={{ overflowX:'auto' }}>
                  <Table className="rep-table" hover borderless>
                    <thead>
                      <tr>
                        <th>#</th><th>Origen</th><th>Destino</th>
                        <th>Mercancía</th><th>Peso (T)</th><th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length===0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">Sin resultados.</td></tr>
                      ) : filtered.map((v,i)=>(
                        <tr key={v.id}>
                          <td className="text-muted fw-bold">{i+1}</td>
                          <td><i className="bi bi-circle-fill me-1" style={{ color:'#10B981', fontSize:'7px', verticalAlign:'middle' }}></i>{v.origen}</td>
                          <td><i className="bi bi-geo-alt-fill me-1" style={{ color:'#EF4444', fontSize:'11px', verticalAlign:'middle' }}></i>{v.destino}</td>
                          <td>{v.tipoMercancia}</td>
                          <td><strong>{v.pesoCarga}</strong></td>
                          <td>
                            <span style={{ background:`${statusColor[v.estado]||'#64748b'}18`, color:statusColor[v.estado]||'#64748b',
                              padding:'3px 10px', borderRadius:'20px', fontSize:'.74rem', fontWeight:700 }}>
                              <span style={{ display:'inline-block', width:'7px', height:'7px', borderRadius:'50%',
                                background:statusColor[v.estado]||'#64748b', marginRight:'5px', verticalAlign:'middle' }}/>
                              {v.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="text-muted small mt-2">
                  Mostrando <strong>{filtered.length}</strong> de <strong>{total}</strong> viajes
                  <span className="ms-3 text-success">
                    <i className="bi bi-info-circle me-1"></i>
                    El PDF exportado incluye los filtros aplicados
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════ TAB: PLANIFICACIÓN ══════════ */}
      {activeTab==='planificacion' && (
        <Row className="g-4">

          {/* Panel lateral */}
          <Col lg={4}>
            <div style={{ background:'#fff', borderRadius:'18px', padding:'20px', border:'1px solid #e2e8f0', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
              <h6 className="fw-bold text-tc-blue mb-1">
                <i className="bi bi-signpost-split-fill me-2" style={{ color:'#f26a21' }}></i>
                Todos los Viajes
              </h6>
              <p className="text-muted small mb-3">Selecciona cualquier viaje para visualizar y modificar su ruta.</p>

              {/* Filtros */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <input
                  placeholder="Buscar origen / destino..."
                  value={planSearch}
                  onChange={e => setPlanSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: '120px',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    padding: '7px 12px', fontSize: '.8rem', fontWeight: 500,
                    outline: 'none', color: '#1e293b',
                  }}
                />
                <select
                  value={planFilterEstado}
                  onChange={e => setPlanFilterEstado(e.target.value)}
                  style={{
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    padding: '7px 10px', fontSize: '.78rem', fontWeight: 600,
                    color: '#475569', background: '#f8fafc', outline: 'none',
                  }}
                >
                  <option value="">Todos</option>
                  <option>EnCurso</option>
                  <option>Asignado</option>
                  <option>Disponible</option>
                  <option>Finalizado</option>
                  <option>Cancelado</option>
                </select>
              </div>

              {/* Lista de viajes */}
              {(() => {
                const planViajes = viajes.filter(v => {
                  if (planFilterEstado && v.estado !== planFilterEstado) return false;
                  const q = planSearch.toLowerCase();
                  if (q && !v.origen?.toLowerCase().includes(q) && !v.destino?.toLowerCase().includes(q)) return false;
                  return true;
                });

                if (planViajes.length === 0) return (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-search fs-3 d-block mb-2 opacity-25"></i>
                    Sin resultados para los filtros aplicados.
                  </div>
                );

                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'360px', overflowY:'auto', paddingRight:'2px' }}>
                    {planViajes.map((v, idx) => {
                      const isActive = v.estado === 'EnCurso' || v.estado === 'Asignado';
                      const prog = progresses[v.id] || 0;
                      const info = getRouteInfo(v.origen, v.destino);
                      const sColor = statusColor[v.estado] || '#64748b';
                      const isSelected = selectedTripId === v.id;

                      return (
                        <button
                          key={v.id}
                          className={`trip-selector-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedTripId(v.id)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#1e293b', display:'flex', alignItems:'center', gap:'6px' }}>
                                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: ROUTE_COLORS[idx % ROUTE_COLORS.length], flexShrink:0, display:'inline-block' }}/>
                                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {v.origen} → {v.destino}
                                </span>
                              </div>
                              <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:'3px', display:'flex', alignItems:'center', gap:'8px' }}>
                                <span>{v.tipoMercancia} · {v.pesoCarga} T · {info.distKm} km</span>
                              </div>
                            </div>
                            <div className="d-flex flex-column align-items-end gap-1 ms-2">
                              {/* Badge estado */}
                              <span style={{
                                background: `${sColor}18`, color: sColor,
                                padding: '2px 8px', borderRadius: '20px',
                                fontSize: '.65rem', fontWeight: 700, whiteSpace: 'nowrap',
                              }}>
                                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sColor, display:'inline-block', marginRight:'4px', verticalAlign:'middle' }}/>
                                {v.estado}
                              </span>
                              {/* Botón editar */}
                              <button
                                className="edit-btn"
                                onClick={e => { e.stopPropagation(); handleEdit(v); }}
                              >
                                <i className="bi bi-pencil-fill me-1"></i>Editar
                              </button>
                            </div>
                          </div>

                          {/* Barra de progreso solo para activos */}
                          {isActive && (
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <div className="progress-mini flex-grow-1">
                                <div className="progress-mini-fill" style={{ width:`${prog}%` }}/>
                              </div>
                              <span style={{ fontSize:'.68rem', fontWeight:700, color:'#f26a21', minWidth:'28px' }}>
                                {prog.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Info del viaje seleccionado */}
              {selectedTrip && (
                <div style={{ marginTop:'16px', padding:'12px', background:'linear-gradient(135deg,#fff7ed,#fef3c7)', borderRadius:'12px', border:'1px solid #fed7aa' }}>
                  <div style={{ fontSize:'.7rem', color:'#92400e', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:'8px' }}>
                    <i className="bi bi-info-circle me-1"></i>Ruta seleccionada
                  </div>
                  {(() => {
                    const info = getRouteInfo(selectedTrip.origen, selectedTrip.destino);
                    return (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                        {[
                          { lbl:'Distancia', val:`${info.distKm} km` },
                          { lbl:'Tiempo',    val:`${Math.floor(info.hours)}h ${Math.round((info.hours%1)*60)}min` },
                          { lbl:'Combustible',val:`${info.totalFuel} L` },
                          { lbl:'Costo',     val:`$${info.fuelCost}` },
                        ].map((it,i) => (
                          <div key={i} style={{ background:'rgba(255,255,255,.75)', borderRadius:'8px', padding:'7px 9px' }}>
                            <div style={{ fontSize:'.6rem', color:'#92400e', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>{it.lbl}</div>
                            <div style={{ fontSize:'.9rem', fontWeight:800, color:'#1e293b' }}>{it.val}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </Col>

          {/* Mapa con todas las rutas */}
          <Col lg={8}>
            <div style={{ position:'sticky', top:'16px' }}>
              <div className="map-plan-wrapper">
                <MapContainer center={[-1.5,-78.6]} zoom={6} scrollWheelZoom style={{ height:'100%', width:'100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Ajustar vista al viaje seleccionado */}
                  {planWaypoints.length > 0 && <FitBounds positions={planWaypoints}/>}

                  {/* Rutas de los demás viajes en gris tenue */}
                  {viajes.filter(v => v.id !== selectedTripId).map((v) => {
                    const wps = v._customWaypoints || getRouteInfo(v.origen, v.destino).waypoints;
                    return (
                      <Polyline key={`bg-${v.id}`} positions={wps}
                        pathOptions={{ color:'#94a3b8', weight:2.5, opacity:.25, dashArray:'6,6' }}/>
                    );
                  })}

                  {/* Ruta del viaje SELECCIONADO */}
                  {selectedTrip && planWaypoints.length > 0 && (
                    <>
                      <Polyline positions={planWaypoints}
                        pathOptions={{ color:'#f26a21', weight:10, opacity:.12 }}/>
                      <Polyline positions={planWaypoints}
                        pathOptions={{ color:'#f26a21', weight:5, opacity:.9, lineCap:'round', lineJoin:'round' }}/>

                      {/* Origen */}
                      <Marker position={CITY_GEO[selectedTrip.origen]||planWaypoints[0]} icon={originPin}>
                        <Popup>
                          <strong style={{ color:'#10B981' }}>📍 ORIGEN</strong><br/>
                          <b>{selectedTrip.origen}</b>
                        </Popup>
                      </Marker>

                      {/* Destino */}
                      <Marker position={CITY_GEO[selectedTrip.destino]||planWaypoints[planWaypoints.length-1]} icon={destPin}>
                        <Popup>
                          <strong style={{ color:'#EF4444' }}>🏁 DESTINO</strong><br/>
                          <b>{selectedTrip.destino}</b>
                        </Popup>
                      </Marker>

                      {/* Camión animado — solo si está en tránsito */}
                      {truckPos && (
                        <Marker position={truckPos}
                          icon={truckDivIcon(selectedTrip.transportistaId || 'En Ruta', '#f26a21')}>
                          <Popup>
                            <strong style={{ color:'#f26a21' }}>🚚 En movimiento</strong><br/>
                            {selectedTrip.origen} → {selectedTrip.destino}<br/>
                            <small>Progreso: {(progresses[selectedTrip.id]||0).toFixed(0)}%</small>
                          </Popup>
                        </Marker>
                      )}
                    </>
                  )}

                  {/* Camiones de viajes activos que no están seleccionados */}
                  {activeTrips.filter(v => v.id !== selectedTripId).map((v, idx) => {
                    const wps = v._customWaypoints || getRouteInfo(v.origen, v.destino).waypoints;
                    const pos = interpolate(wps, (progresses[v.id]||0)/100);
                    const col = ROUTE_COLORS[(idx+1) % ROUTE_COLORS.length];
                    return (
                      <Marker key={`truck-${v.id}`} position={pos}
                        icon={truckDivIcon('', col)}
                        eventHandlers={{ click: () => setSelectedTripId(v.id) }}>
                        <Popup>
                          <b>{v.origen} → {v.destino}</b><br/>
                          <small>Clic para seleccionar</small>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              <div className="text-center mt-2 text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Clic en cualquier viaje de la lista o en un camión del mapa para seleccionar. Usa <strong>Editar</strong> para modificar la ruta.
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* ══════════ MODAL EDICIÓN DE RUTA ══════════ */}
      <Modal show={showEditModal} onHide={()=>setShowEditModal(false)} centered size="xl">
        <Modal.Header closeButton style={{ borderBottom:'1px solid #f1f5f9', padding:'20px 24px' }}>
          <Modal.Title>
            <i className="bi bi-signpost-split-fill me-2 text-tc-orange"></i>
            Modificar Ruta del Viaje
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding:'24px' }}>
          {editViaje && (() => {
            // Construir preview waypoints dinámicamente
            const previewWps: [number,number][] = [
              CITY_GEO[editOrigen] || [-0.18,-78.47],
              ...editWaypoints.map(c => CITY_GEO[c]).filter(Boolean) as [number,number][],
              CITY_GEO[editDestino] || [-2.19,-79.89],
            ];
            const distKm = previewWps.length >= 2
              ? Math.round(previewWps.reduce((acc, p, i) => i === 0 ? 0 : acc + haversineKm(previewWps[i-1], p), 0) * 1.3)
              : 0;
            const hours = distKm / 75;
            const fuel  = Math.round((distKm/100)*28);

            const availableStops = CITIES.filter(
              c => c !== editOrigen && c !== editDestino && !editWaypoints.includes(c)
            );

            return (
              <Row className="g-4">
                {/* ── Columna izquierda: controles ── */}
                <Col lg={5}>
                  {/* ID del viaje */}
                  <div className="mb-3 p-3" style={{ background:'#f8fafc', borderRadius:'12px' }}>
                    <div className="text-muted small fw-bold mb-1">VIAJE ID</div>
                    <div className="fw-bold text-tc-blue" style={{ fontFamily:'monospace', fontSize:'.9rem' }}>#{editViaje.id}</div>
                  </div>

                  {/* Origen */}
                  <div className="mb-3">
                    <div className="mb-1 d-flex align-items-center gap-2">
                      <div style={{ width:12, height:12, borderRadius:'50%', background:'#10B981', flexShrink:0 }}/>
                      <span className="text-muted small fw-bold">CIUDAD DE ORIGEN</span>
                    </div>
                    <Form.Select value={editOrigen}
                      onChange={e => { setEditOrigen(e.target.value); setEditWaypoints([]); }}
                      style={{ borderRadius:'10px', border:'2px solid #e2e8f0', padding:'9px 12px', fontWeight:600 }}>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                  </div>

                  {/* ── Paradas intermedias ── */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div style={{ width:12, height:12, borderRadius:'3px', background:'#F59E0B', flexShrink:0 }}/>
                      <span className="text-muted small fw-bold">PARADAS INTERMEDIAS</span>
                      <span style={{ marginLeft:'auto', background:'#fef3c7', color:'#92400e', borderRadius:'20px',
                        padding:'1px 8px', fontSize:'.68rem', fontWeight:700 }}>
                        {editWaypoints.length} parada{editWaypoints.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Lista de paradas actuales */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'10px' }}>
                      {editWaypoints.length === 0 ? (
                        <div style={{ background:'#f8fafc', border:'2px dashed #e2e8f0', borderRadius:'10px',
                          padding:'12px', textAlign:'center', color:'#94a3b8', fontSize:'.8rem' }}>
                          <i className="bi bi-signpost2 me-1"></i>
                          Sin paradas — ruta directa
                        </div>
                      ) : editWaypoints.map((city, idx) => (
                        <div key={city} style={{ display:'flex', alignItems:'center', gap:'8px',
                          background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'8px 12px' }}>
                          {/* Reordenar */}
                          <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                const wps = [...editWaypoints];
                                [wps[idx-1], wps[idx]] = [wps[idx], wps[idx-1]];
                                setEditWaypoints(wps);
                              }}
                              style={{ background:'none', border:'none', cursor: idx===0?'default':'pointer',
                                color: idx===0?'#cbd5e1':'#64748b', padding:0, fontSize:'10px', lineHeight:1 }}>
                              ▲
                            </button>
                            <button
                              disabled={idx === editWaypoints.length-1}
                              onClick={() => {
                                const wps = [...editWaypoints];
                                [wps[idx], wps[idx+1]] = [wps[idx+1], wps[idx]];
                                setEditWaypoints(wps);
                              }}
                              style={{ background:'none', border:'none', cursor: idx===editWaypoints.length-1?'default':'pointer',
                                color: idx===editWaypoints.length-1?'#cbd5e1':'#64748b', padding:0, fontSize:'10px', lineHeight:1 }}>
                              ▼
                            </button>
                          </div>
                          {/* Número de parada */}
                          <div style={{ width:22, height:22, borderRadius:'50%', background:'#fef3c7',
                            color:'#92400e', fontSize:'.72rem', fontWeight:800,
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {idx+1}
                          </div>
                          <span style={{ flex:1, fontWeight:600, color:'#1e293b', fontSize:'.85rem' }}>{city}</span>
                          {/* Eliminar */}
                          <button
                            onClick={() => setEditWaypoints(prev => prev.filter(c => c !== city))}
                            style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'6px',
                              color:'#ef4444', cursor:'pointer', padding:'3px 8px', fontSize:'.72rem', fontWeight:700,
                              transition:'all .15s' }}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Agregar parada */}
                    {availableStops.length > 0 && (
                      <div style={{ display:'flex', gap:'8px' }}>
                        <Form.Select size="sm" id="add-waypoint-select"
                          style={{ borderRadius:'10px', border:'2px solid #e2e8f0', fontWeight:600, flex:1 }}
                          defaultValue="">
                          <option value="" disabled>Agregar ciudad...</option>
                          {availableStops.map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                        <button
                          onClick={() => {
                            const sel = (document.getElementById('add-waypoint-select') as HTMLSelectElement).value;
                            if (sel && !editWaypoints.includes(sel)) {
                              setEditWaypoints(prev => [...prev, sel]);
                              (document.getElementById('add-waypoint-select') as HTMLSelectElement).value = '';
                            }
                          }}
                          style={{ background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff',
                            border:'none', borderRadius:'10px', padding:'6px 14px', fontWeight:700,
                            cursor:'pointer', whiteSpace:'nowrap', fontSize:'.82rem' }}>
                          <i className="bi bi-plus-lg me-1"></i>Agregar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Destino */}
                  <div className="mb-3">
                    <div className="mb-1 d-flex align-items-center gap-2">
                      <div style={{ width:12, height:12, borderRadius:'50%', background:'#EF4444', flexShrink:0 }}/>
                      <span className="text-muted small fw-bold">CIUDAD DE DESTINO</span>
                    </div>
                    <Form.Select value={editDestino}
                      onChange={e => { setEditDestino(e.target.value); setEditWaypoints([]); }}
                      style={{ borderRadius:'10px', border:'2px solid #e2e8f0', padding:'9px 12px', fontWeight:600 }}>
                      {CITIES.filter(c => c !== editOrigen).map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                  </div>

                  {/* Métricas calculadas */}
                  {editOrigen !== editDestino && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:'12px', padding:'14px' }}>
                      <div className="text-muted small fw-bold mb-2">
                        <i className="bi bi-calculator me-1 text-tc-orange"></i>RESUMEN DE RUTA
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                        {[
                          { lbl:'Distancia', val:`${distKm} km`,            icon:'bi-rulers',          color:'#3B82F6' },
                          { lbl:'Tiempo',    val:`${Math.floor(hours)}h ${Math.round((hours%1)*60)}min`, icon:'bi-clock', color:'#F59E0B' },
                          { lbl:'Combustible',val:`${fuel} L`,              icon:'bi-fuel-pump',       color:'#10B981' },
                          { lbl:'Paradas',   val:`${editWaypoints.length}`, icon:'bi-signpost2',       color:'#8B5CF6' },
                        ].map((it,i) => (
                          <div key={i} style={{ background:'rgba(255,255,255,.8)', borderRadius:'8px', padding:'9px 10px' }}>
                            <div style={{ fontSize:'.65rem', color:'#065f46', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>
                              <i className={`bi ${it.icon} me-1`}></i>{it.lbl}
                            </div>
                            <div style={{ fontSize:'1rem', fontWeight:800, color:it.color, marginTop:'2px' }}>{it.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editOrigen === editDestino && (
                    <div className="p-3 text-center" style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px', color:'#991b1b', fontSize:'.85rem' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      El origen y el destino no pueden ser la misma ciudad.
                    </div>
                  )}
                </Col>

                {/* ── Columna derecha: mapa en vivo ── */}
                <Col lg={7}>
                  <div className="text-muted small fw-bold mb-2">
                    <i className="bi bi-map me-1 text-tc-orange"></i>
                    PREVISUALIZACIÓN EN TIEMPO REAL
                  </div>
                  <div style={{ borderRadius:'14px', overflow:'hidden', height:'440px',
                    border:'2px solid #e2e8f0', boxShadow:'0 4px 20px rgba(0,0,0,.1)' }}>
                    <MapContainer center={CITY_GEO[editOrigen]||[-1.5,-78.6]} zoom={6}
                      scrollWheelZoom style={{ height:'100%', width:'100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds positions={previewWps}/>

                      {/* Ruta personalizada */}
                      <Polyline positions={previewWps}
                        pathOptions={{ color:'#94a3b8', weight:8, opacity:.15 }}/>
                      <Polyline positions={previewWps}
                        pathOptions={{ color:'#f26a21', weight:4, opacity:.9, lineCap:'round', lineJoin:'round', dashArray: editWaypoints.length > 0 ? undefined : '8,6' }}/>

                      {/* Marcador Origen */}
                      <Marker position={CITY_GEO[editOrigen]||previewWps[0]} icon={originPin}>
                        <Popup><strong style={{color:'#10B981'}}>A — ORIGEN</strong><br/><b>{editOrigen}</b></Popup>
                      </Marker>

                      {/* Marcadores intermedios */}
                      {editWaypoints.map((city, idx) => {
                        const stopIcon = L.divIcon({
                          className: '',
                          html: `<div style="background:#F59E0B;width:28px;height:28px;
                            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                            border:2px solid #fff;box-shadow:0 2px 8px #F59E0B88;
                            display:flex;align-items:center;justify-content:center;
                            color:#fff;font-size:10px;font-weight:800;">
                            <span style="transform:rotate(45deg)">${idx+1}</span></div>`,
                          iconSize: [28, 28],
                          iconAnchor: [14, 28],
                        });
                        return (
                          <Marker key={city} position={CITY_GEO[city]} icon={stopIcon}>
                            <Popup>
                              <strong style={{color:'#F59E0B'}}>Parada {idx+1}</strong><br/>
                              <b>{city}</b>
                            </Popup>
                          </Marker>
                        );
                      })}

                      {/* Marcador Destino */}
                      <Marker position={CITY_GEO[editDestino]||previewWps[previewWps.length-1]} icon={destPin}>
                        <Popup><strong style={{color:'#EF4444'}}>B — DESTINO</strong><br/><b>{editDestino}</b></Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <div className="text-center mt-2 text-muted" style={{ fontSize:'.75rem' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    El mapa se actualiza en tiempo real con cada cambio de ruta
                  </div>
                </Col>
              </Row>
            );
          })()}
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #f1f5f9', padding:'16px 24px', gap:'10px' }}>
          <Button variant="light" onClick={()=>setShowEditModal(false)}
            style={{ borderRadius:'10px', fontWeight:600 }}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEdit} disabled={editOrigen===editDestino}
            style={{ background:'linear-gradient(135deg,#f26a21,#f59e0b)', border:'none',
              borderRadius:'10px', fontWeight:700, padding:'9px 24px' }}>
            <i className="bi bi-check-lg me-1"></i>Guardar Ruta
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
