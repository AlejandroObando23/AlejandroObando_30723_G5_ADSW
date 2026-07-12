import { ISystemObserver, SystemSubject } from './SystemObserver';
import { SmsNotificationStrategy, PushNotificationStrategy } from '../../business/strategies/NotificationStrategies';

// ==========================================
// PATRÓN OBSERVER: OBSERVERS CONCRETOS
// ==========================================
/**
 * Cada clase "Observer" concreta reacciona de forma independiente a los eventos
 * notificados por el Sujeto, promoviendo el bajo acoplamiento.
 */
export class CoordinadorObserver implements ISystemObserver {
  update(event: string, data: any): void {
    if (['VIAJE_CREADO', 'VIAJE_CANCELADO', 'VIAJE_REPROGRAMADO', 'DESVIO_RUTA'].includes(event)) {
      console.log(`[CoordinadorObserver] Alerta recibida: ${event}. Actualizando panel de control para el viaje ${data.id}.`);
    }
  }
}

export class SecretariaObserver implements ISystemObserver {
  update(event: string, data: any): void {
    if (['VIAJE_CREADO', 'VIAJE_CANCELADO', 'DOCUMENTO_VENCIDO'].includes(event)) {
      console.log(`[SecretariaObserver] Notificación Administrativa: ${event}. Procesando registro del viaje ${data.id}.`);
    }
  }
}

export class TransportistaObserver implements ISystemObserver {
  private smsStrategy = new SmsNotificationStrategy();
  private pushStrategy = new PushNotificationStrategy();

  update(event: string, data: any): void {
    if (event === 'VIAJE_ASIGNADO' && data.transportistaId) {
      const message = `Tienes un nuevo viaje asignado (${data.origen} -> ${data.destino}).`;
      console.log(`[TransportistaObserver] SMS/Push enviado al transportista ID ${data.transportistaId}: ${message}`);
      this.smsStrategy.send(data.transportistaId, message).catch(console.error);
      this.pushStrategy.send(data.transportistaId, message).catch(console.error);
    }
    if (event === 'VIAJE_CANCELADO' && data.transportistaId) {
      const message = `Tu viaje ha sido cancelado.`;
      console.log(`[TransportistaObserver] SMS/Push enviado al transportista ID ${data.transportistaId}: ${message}`);
      this.smsStrategy.send(data.transportistaId, message).catch(console.error);
      this.pushStrategy.send(data.transportistaId, message).catch(console.error);
    }
  }
}

// ==========================================
// PATRÓN OBSERVER: SUJETO (SUBJECT)
// ==========================================
/**
 * ViajeSubject es el "Sujeto Observable".
 * Mantiene la lista de observadores (heredada de SystemSubject) y provee métodos
 * para notificar eventos clave del ciclo de vida de un viaje.
 * La lógica principal no sabe quién reacciona, solo notifica que "algo pasó".
 */
export class ViajeSubject extends SystemSubject {
  constructor() {
    super();
    // Suscribir automáticamente a los observadores por defecto
    this.attach(new CoordinadorObserver());
    this.attach(new SecretariaObserver());
    this.attach(new TransportistaObserver());
  }

  // Métodos semánticos para uso fácil
  notificarViajeCreado(viaje: any) {
    this.notify('VIAJE_CREADO', viaje);
  }

  notificarViajeAsignado(viaje: any) {
    this.notify('VIAJE_ASIGNADO', viaje);
  }

  notificarViajeCancelado(viaje: any) {
    this.notify('VIAJE_CANCELADO', viaje);
  }
}
