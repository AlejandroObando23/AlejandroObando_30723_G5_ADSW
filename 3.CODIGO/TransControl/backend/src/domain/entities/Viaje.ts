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
}
