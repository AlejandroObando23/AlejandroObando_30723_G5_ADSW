export interface Documento {
  id: string;
  tipo: 'Cedula' | 'Licencia Profesional' | 'Matricula' | 'Revision Tecnica' | 'SOAT';
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  rutaArchivo: string;
  transportistaId?: string;
  vehiculoId?: string;
}
