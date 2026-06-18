export interface Ruta {
  id: string;
  viajeId: string;
  puntos: { lat: number; lng: number; descripcion?: string }[];
  distanciaEstimadaKm: number;
  tiempoEstimadoMin: number;
}
