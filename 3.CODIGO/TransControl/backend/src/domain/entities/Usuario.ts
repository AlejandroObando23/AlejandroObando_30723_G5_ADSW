export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rolId: string;
}

export interface Rol {
  id: string;
  nombre: string;
  permisos: string[];
}
