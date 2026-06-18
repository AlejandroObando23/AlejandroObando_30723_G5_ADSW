export interface Notificacion {
  id: string;
  mensaje: string;
  fecha: Date;
  destinatario: string;
  tipo: 'Email' | 'Push' | 'Sms';
}
