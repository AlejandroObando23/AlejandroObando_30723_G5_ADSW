export type ViajeEstado = 'Disponible' | 'Asignado' | 'EnCurso' | 'Finalizado' | 'Cancelado';

export interface Viaje {
  id: string;
  estado: ViajeEstado;
  fechaCreacion: Date;
  origen: string;
  destino: string;
  pesoCarga: number;
  tipoMercancia: string;
  contenedor: string;
  observaciones: string;
  transportistaId?: string;
  rutaCriterio?: string;
  rutaTiempoEstimado?: string;
  rutaDistancia?: string;
  rutaPeajes?: number;
  rutaCamino?: string;
  fechaProgramada?: string;
}
