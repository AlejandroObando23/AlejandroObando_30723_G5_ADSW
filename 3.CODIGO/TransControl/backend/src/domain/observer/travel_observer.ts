import { ISystemObserver, SystemSubject } from './SystemObserver';

// ==========================================
// OBSERVERS CONCRETOS
// ==========================================

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
  update(event: string, data: any): void {
    if (event === 'VIAJE_ASIGNADO' && data.transportistaId) {
      console.log(`[TransportistaObserver] SMS/Push enviado al transportista ID ${data.transportistaId}: Tienes un nuevo viaje asignado (${data.origen} -> ${data.destino}).`);
    }
    if (event === 'VIAJE_CANCELADO' && data.transportistaId) {
      console.log(`[TransportistaObserver] SMS/Push enviado al transportista ID ${data.transportistaId}: Tu viaje ha sido cancelado.`);
    }
  }
}

// ==========================================
// SUBJECT ESPECÍFICO (Opcional, pero recomendado para mantener encapsulamiento)
// ==========================================

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
