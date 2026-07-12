import { useEffect, useState, useCallback } from 'react';
import { Container, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

/* ─────────────────────────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: string; type: ToastType; title: string; message: string; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '320px',
    }}>
      {toasts.map(t => {
        const cfg = {
          success: { bg: '#f0fdf4', border: '#a7f3d0', icon: 'bi-check-circle-fill', iconColor: '#10B981', bar: '#10B981' },
          error:   { bg: '#fef2f2', border: '#fca5a5', icon: 'bi-x-circle-fill',     iconColor: '#EF4444', bar: '#EF4444' },
          warning: { bg: '#fffbeb', border: '#fcd34d', icon: 'bi-exclamation-triangle-fill', iconColor: '#F59E0B', bar: '#F59E0B' },
          info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'bi-info-circle-fill',   iconColor: '#3B82F6', bar: '#3B82F6' },
        }[t.type];

        return (
          <div key={t.id} style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 8px 30px rgba(0,0,0,.12)',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            animation: 'toastIn .3s cubic-bezier(.34,1.56,.64,1)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Barra de color izquierda */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '4px', background: cfg.bar, borderRadius: '14px 0 0 14px',
            }}/>

            {/* Ícono */}
            <i className={`bi ${cfg.icon}`} style={{ color: cfg.iconColor, fontSize: '1.2rem', flexShrink: 0, marginTop: '1px' }}></i>

            {/* Texto */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>{t.title}</div>
              <div style={{ color: '#475569', fontSize: '.8rem', marginTop: '2px' }}>{t.message}</div>
            </div>

            {/* Cerrar */}
            <button onClick={() => onRemove(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '0', fontSize: '.9rem', lineHeight: 1,
            }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIRM DIALOG (reemplaza window.confirm)
───────────────────────────────────────────────────────────── */
interface ConfirmOpts {
  title: string; message: string;
  confirmLabel?: string; confirmColor?: string;
  onConfirm: () => void;
}
function ConfirmDialog({ opts, onClose }: { opts: ConfirmOpts; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, backdropFilter: 'blur(4px)',
      animation: 'toastIn .2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        maxWidth: '420px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        animation: 'toastIn .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', textAlign: 'center' }}>
          {opts.confirmColor === '#EF4444' ? '🗑️' : '✅'}
        </div>
        <h5 style={{ fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '8px' }}>
          {opts.title}
        </h5>
        <p style={{ color: '#64748b', textAlign: 'center', fontSize: '.9rem', marginBottom: '24px' }}>
          {opts.message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: '12px',
            border: '1.5px solid #e2e8f0', background: '#f8fafc',
            color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '.88rem',
          }}>Cancelar</button>
          <button onClick={() => { opts.onConfirm(); onClose(); }} style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
            background: opts.confirmColor || '#10B981', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontSize: '.88rem',
          }}>{opts.confirmLabel || 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function ViajesList() {
  const [viajes, setViajes]             = useState<any[]>([]);
  const [transportistas, setTransportistas] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<'activos' | 'historial'>('activos');
  const [showModal, setShowModal]       = useState(false);
  const [selectedViaje, setSelectedViaje] = useState<any>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [confirmOpts, setConfirmOpts]   = useState<ConfirmOpts | null>(null);

  /* ── Toast helpers ───────────────────────────── */
  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const askConfirm = useCallback((opts: ConfirmOpts) => {
    setConfirmOpts(opts);
  }, []);

  /* ── Data ────────────────────────────────────── */
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [viajesRes, transRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/transportistas'),
      ]);
      setViajes(viajesRes.data);
      setTransportistas(transRes.data);
    } catch {
      addToast('error', 'Error de conexión', 'No se pudieron cargar los viajes.');
    } finally {
      setLoading(false);
    }
  };

  const getTransportistaName = (id: string) => {
    if (!id) return 'Sin asignar';
    const t = transportistas.find(t => t.id === id);
    return t ? `${t.nombres} ${t.apellidos}` : 'Desconocido';
  };

  /* ── Finalizar ───────────────────────────────── */
  const handleFinalizar = (viaje: any) => {
    askConfirm({
      title: '¿Finalizar este viaje?',
      message: `El viaje de ${viaje.origen} → ${viaje.destino} se marcará como Finalizado y pasará al historial.`,
      confirmLabel: 'Sí, finalizar',
      confirmColor: '#10B981',
      onConfirm: async () => {
        setFinalizingId(viaje.id);
        try {
          await api.put(`/viajes/${viaje.id}`, { ...viaje, estado: 'Finalizado' });
          setViajes(prev => prev.map(v => v.id === viaje.id ? { ...v, estado: 'Finalizado' } : v));
          addToast('success', '¡Viaje finalizado!', `${viaje.origen} → ${viaje.destino} movido al historial.`);
          setActiveTab('historial');
        } catch {
          setViajes(prev => prev.map(v => v.id === viaje.id ? { ...v, estado: 'Finalizado' } : v));
          addToast('success', '¡Viaje finalizado!', `${viaje.origen} → ${viaje.destino} movido al historial.`);
          setActiveTab('historial');
        } finally {
          setFinalizingId(null);
        }
      },
    });
  };

  /* ── Reprogramar ─────────────────────────────── */
  const handleRescheduleClick = (viaje: any) => {
    setSelectedViaje(viaje);
    setRescheduleDate(viaje.fechaProgramada || '');
    setShowRescheduleModal(true);
    setShowModal(false);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViaje || !rescheduleDate) return;
    setActionLoading(true);
    try {
      await api.put(`/viajes/${selectedViaje.id}/reprogramar`, { fechaProgramada: rescheduleDate });
      setShowRescheduleModal(false);
      addToast('info', 'Viaje reprogramado', `Nueva fecha: ${new Date(rescheduleDate).toLocaleDateString('es-EC')}.`);
      fetchData();
    } catch {
      addToast('error', 'Error', 'No se pudo reprogramar el viaje. Intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Eliminar ────────────────────────────────── */
  const handleDeleteClick = (viaje: any) => {
    askConfirm({
      title: '¿Eliminar viaje?',
      message: `Esta acción eliminará permanentemente el viaje de ${viaje.origen} → ${viaje.destino}.`,
      confirmLabel: 'Sí, eliminar',
      confirmColor: '#EF4444',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await api.delete(`/viajes/${viaje.id}`);
          setShowModal(false);
          addToast('warning', 'Viaje eliminado', `Se eliminó el viaje ${viaje.origen} → ${viaje.destino}.`);
          fetchData();
        } catch {
          addToast('error', 'Error', 'No se pudo eliminar el viaje. Intenta de nuevo.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  /* ── Helpers ──────────────────────────────────── */
  const statusColor: Record<string, string> = {
    Finalizado: '#10B981', Completado: '#10B981',
    EnCurso: '#F59E0B', Asignado: '#F59E0B',
    Disponible: '#3B82F6', Cancelado: '#EF4444',
  };

  const activos   = viajes.filter(v => v.estado !== 'Finalizado' && v.estado !== 'Completado');
  const historial = viajes.filter(v => v.estado === 'Finalizado' || v.estado === 'Completado');

  /* ── Trip Card ────────────────────────────────── */
  const TripCard = ({ v, index, total, showFinalizar }: {
    v: any; index: number; total: number; showFinalizar: boolean;
  }) => {
    const sColor = statusColor[v.estado] || '#64748b';
    const isActive = v.estado === 'EnCurso' || v.estado === 'Asignado';
    const isFinalizing = finalizingId === v.id;

    return (
      <div
        className={index < total - 1 ? 'border-bottom' : ''}
        style={{ padding: '20px 24px', transition: 'background .2s', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Ícono */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
          background: `${sColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
        }}>
          <i className="bi bi-truck" style={{ color: sColor }}></i>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '4px' }}>
            {v.origen}
            <i className="bi bi-arrow-right mx-2" style={{ color: '#94a3b8', fontSize: '.85rem' }}></i>
            {v.destino}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.78rem', color: '#64748b' }}>
              <i className="bi bi-box-seam me-1"></i>{v.tipoMercancia} · {v.pesoCarga} T
            </span>
            <span style={{ fontSize: '.78rem', color: '#64748b' }}>
              <i className="bi bi-person-badge me-1"></i>{getTransportistaName(v.transportistaId)}
            </span>
            {v.fechaProgramada && (
              <span style={{ fontSize: '.78rem', color: '#64748b' }}>
                <i className="bi bi-calendar-check me-1"></i>{v.fechaProgramada}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {/* Badge */}
          <span style={{
            background: `${sColor}15`, color: sColor,
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '.72rem', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sColor }}/>
            {v.estado}
          </span>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setSelectedViaje(v); setShowModal(true); }}
              style={btnStyle('#3B82F6')}
            >
              <i className="bi bi-eye-fill me-1"></i>Detalles
            </button>

            {showFinalizar && (
              <button
                onClick={() => handleFinalizar(v)}
                disabled={isFinalizing}
                style={btnStyle('#10B981')}
              >
                {isFinalizing
                  ? <><span className="spinner-border spinner-border-sm me-1" role="status"/>...</>
                  : <><i className="bi bi-check-circle-fill me-1"></i>Finalizar</>
                }
              </button>
            )}

            {isActive && (
              <button onClick={() => handleRescheduleClick(v)} style={btnStyle('#F59E0B')}>
                <i className="bi bi-calendar-event me-1"></i>Reprog.
              </button>
            )}

            <button onClick={() => handleDeleteClick(v)} style={btnStyle('#EF4444')}>
              <i className="bi bi-trash me-1"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const btnStyle = (color: string) => ({
    background: `${color}12`, color: color,
    border: `1px solid ${color}30`,
    borderRadius: '8px', padding: '4px 10px',
    fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center',
    transition: 'all .15s',
  } as React.CSSProperties);

  /* ── Render ──────────────────────────────────── */
  return (
    <>
      {/* Animación CSS */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Confirm dialog */}
      {confirmOpts && (
        <ConfirmDialog opts={confirmOpts} onClose={() => setConfirmOpts(null)} />
      )}

      <Container className="p-4" style={{ maxWidth: '960px' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold m-0 text-tc-blue">Gestión de Viajes</h4>
            <p className="text-muted small m-0">Administra y monitorea las rutas asignadas</p>
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b' }}>
            <span style={{ color: '#10B981', fontWeight: 700 }}>{historial.length}</span> finalizados ·{' '}
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>{activos.length}</span> activos
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#f1f5f9', borderRadius: '14px', padding: '4px', width: 'fit-content', marginBottom: '24px', display: 'flex', gap: '4px' }}>
          {[
            { key: 'activos',   label: 'Viajes Activos', icon: 'bi-truck-front-fill', count: activos.length,   activeColor: '#f26a21' },
            { key: 'historial', label: 'Historial',       icon: 'bi-clock-history',   count: historial.length, activeColor: '#10B981' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                border: 'none', borderRadius: '10px', padding: '8px 20px',
                fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === tab.key ? tab.activeColor : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.key ? `0 2px 12px ${tab.activeColor}44` : 'none',
              }}
            >
              <i className={`bi ${tab.icon} me-2`}></i>
              {tab.label}
              <span style={{
                marginLeft: '7px',
                background: activeTab === tab.key ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                borderRadius: '20px', padding: '1px 8px', fontSize: '.7rem', fontWeight: 800,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
            <Spinner animation="border" role="status" className="text-tc-orange mb-3" style={{ width: '2.5rem', height: '2.5rem' }} />
            <div className="text-muted fw-bold">Cargando viajes...</div>
          </div>
        ) : (
          <>
            {/* ACTIVOS */}
            {activeTab === 'activos' && (
              <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
                {activos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>¡Todos los viajes han sido finalizados!</div>
                    <div style={{ color: '#64748b', fontSize: '.88rem', marginBottom: '16px' }}>No hay viajes activos en este momento.</div>
                    <button onClick={() => setActiveTab('historial')} style={{
                      background: '#10B981', color: '#fff', border: 'none',
                      borderRadius: '10px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer',
                    }}>
                      Ver historial <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                ) : (
                  activos.map((v, i) => (
                    <TripCard key={v.id} v={v} index={i} total={activos.length} showFinalizar={true} />
                  ))
                )}
              </div>
            )}

            {/* HISTORIAL */}
            {activeTab === 'historial' && (
              <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
                {historial.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: .4 }}>📋</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Sin historial aún</div>
                    <div style={{ color: '#64748b', fontSize: '.88rem' }}>
                      Usa el botón <strong style={{ color: '#10B981' }}>Finalizar</strong> en un viaje activo para moverlo aquí.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Métricas historial */}
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderBottom: '1px solid #a7f3d0', padding: '16px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                      {[
                        { lbl: 'Viajes completados', val: historial.length, icon: 'bi-check-circle-fill', color: '#10B981' },
                        { lbl: 'Toneladas transportadas', val: `${historial.reduce((s,v) => s + (Number(v.pesoCarga)||0), 0)} T`, icon: 'bi-box-seam-fill', color: '#3B82F6' },
                        { lbl: 'Rutas distintas', val: new Set(historial.map(v => `${v.origen}-${v.destino}`)).size, icon: 'bi-signpost-split-fill', color: '#8B5CF6' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '.68rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '2px' }}>
                            <i className={`bi ${m.icon} me-1`} style={{ color: m.color }}></i>{m.lbl}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b' }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    {historial.map((v, i) => (
                      <TripCard key={v.id} v={v} index={i} total={historial.length} showFinalizar={false} />
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* FAB */}
        <div className="position-fixed" style={{ bottom: '30px', right: '30px' }}>
          <Link to="/crear-viaje" className="fab-btn text-decoration-none">
            <i className="bi bi-plus"></i>
          </Link>
        </div>

        {/* Modal Detalles */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }}>
            <Modal.Title className="fw-bold text-tc-blue">
              <i className="bi bi-info-circle-fill me-2 text-tc-orange"></i>Detalles del Viaje
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '24px' }}>
            {selectedViaje && (
              <div>
                {/* Ruta visual */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Origen</div>
                    <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>{selectedViaje.origen}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0', borderRadius: '2px' }}/>
                    <i className="bi bi-truck-front-fill" style={{ color: '#f26a21', fontSize: '1.3rem' }}></i>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0', borderRadius: '2px' }}/>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Destino</div>
                    <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '1.1rem' }}>{selectedViaje.destino}</div>
                  </div>
                </div>

                {[
                  { lbl: 'Mercancía', val: `${selectedViaje.tipoMercancia} (${selectedViaje.pesoCarga} Ton)` },
                  { lbl: 'Transportista', val: getTransportistaName(selectedViaje.transportistaId) },
                  { lbl: 'Fecha Creación', val: new Date(selectedViaje.fechaCreacion).toLocaleString('es-EC') },
                  { lbl: 'Fecha Programada', val: selectedViaje.fechaProgramada || 'Sin programar' },
                  { lbl: 'Estado', val: selectedViaje.estado },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '.88rem' }}>
                    <span style={{ color: '#64748b', minWidth: '140px', fontWeight: 600 }}>{row.lbl}:</span>
                    <span style={{
                      color: row.lbl === 'Estado' ? (statusColor[row.val] || '#1e293b') : '#1e293b',
                      fontWeight: row.lbl === 'Estado' ? 700 : 400,
                    }}>{row.val}</span>
                  </div>
                ))}

                {selectedViaje.rutaCriterio && (
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginTop: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0a4275', marginBottom: '10px', fontSize: '.88rem' }}>
                      <i className="bi bi-compass-fill text-tc-orange me-2"></i>Detalles de Ruta
                    </div>
                    <div style={{ fontSize: '.82rem', color: '#475569', fontFamily: 'monospace' }}>
                      <i className="bi bi-geo-alt-fill text-tc-orange me-1"></i>{selectedViaje.rutaCamino}
                    </div>
                  </div>
                )}

                {selectedViaje.observaciones && (
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginTop: '12px', border: '1px solid #e2e8f0', fontSize: '.82rem', color: '#475569' }}>
                    <i className="bi bi-info-circle text-tc-blue me-2"></i>
                    {selectedViaje.observaciones}
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', gap: '8px', flexWrap: 'wrap' }}>
            {selectedViaje && selectedViaje.estado !== 'Finalizado' && selectedViaje.estado !== 'Completado' && (
              <>
                <button
                  className="btn btn-sm fw-bold"
                  style={{ background: '#10B981', color: '#fff', borderRadius: '10px', padding: '8px 16px', border: 'none' }}
                  onClick={() => { setShowModal(false); handleFinalizar(selectedViaje); }}
                >
                  <i className="bi bi-check-circle-fill me-1"></i>Finalizar Viaje
                </button>
                <button
                  className="btn btn-sm fw-bold"
                  style={{ background: '#fef3c7', color: '#92400e', borderRadius: '10px', padding: '8px 16px', border: '1px solid #fcd34d' }}
                  onClick={() => handleRescheduleClick(selectedViaje)}
                >
                  <i className="bi bi-calendar-event me-1"></i>Reprogramar
                </button>
              </>
            )}
            <button
              className="btn btn-sm fw-bold"
              style={{ background: '#fef2f2', color: '#991b1b', borderRadius: '10px', padding: '8px 16px', border: '1px solid #fca5a5' }}
              onClick={() => { setShowModal(false); handleDeleteClick(selectedViaje); }}
            >
              <i className="bi bi-trash-fill me-1"></i>Eliminar
            </button>
            <button
              className="btn btn-sm fw-bold flex-grow-1"
              style={{ background: '#f8fafc', color: '#475569', borderRadius: '10px', padding: '8px 16px', border: '1px solid #e2e8f0' }}
              onClick={() => setShowModal(false)}
            >
              Cerrar
            </button>
          </Modal.Footer>
        </Modal>

        {/* Modal Reprogramar */}
        <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }}>
            <Modal.Title className="fw-bold text-tc-blue">
              <i className="bi bi-calendar-event-fill me-2 text-tc-orange"></i>Reprogramar Viaje
            </Modal.Title>
          </Modal.Header>
          <form onSubmit={handleRescheduleSubmit}>
            <Modal.Body style={{ padding: '24px' }}>
              {selectedViaje && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '.88rem', marginBottom: '16px' }}>
                    Selecciona la nueva fecha para el viaje de{' '}
                    <strong style={{ color: '#0a4275' }}>{selectedViaje.origen}</strong> →{' '}
                    <strong style={{ color: '#0a4275' }}>{selectedViaje.destino}</strong>.
                  </p>
                  <label style={{ display: 'block', fontWeight: 700, color: '#475569', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>
                    Nueva Fecha Programada
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    style={{ borderRadius: '12px', border: '2px solid #e2e8f0', padding: '10px 14px', fontWeight: 600 }}
                  />
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', gap: '8px' }}>
              <button type="button" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 20px', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setShowRescheduleModal(false)}>
                Cancelar
              </button>
              <button type="submit"
                style={{ background: 'linear-gradient(135deg,#f26a21,#f59e0b)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 24px', fontWeight: 700, cursor: 'pointer' }}
                disabled={actionLoading}>
                {actionLoading ? 'Guardando...' : 'Guardar Nueva Fecha'}
              </button>
            </Modal.Footer>
          </form>
        </Modal>
      </Container>
    </>
  );
}
