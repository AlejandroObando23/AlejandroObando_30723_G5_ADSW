import { Viaje } from '../../domain/entities/Viaje';
import { IViajeRepository } from '../../domain/interfaces/IViajeRepository';
import { ViajeSubject } from '../../domain/observer/travel_observer';
import { v4 as uuidv4 } from 'uuid';
import { RutaCalculadora, RutaMasRapidaStrategy, RutaMasSeguraStrategy, RutaMenorDistanciaStrategy } from '../strategies/route_strategy';

export class ViajeService {
  private viajeRepository: IViajeRepository;
  private observer: ViajeSubject;

  constructor(repository: IViajeRepository, observer: ViajeSubject) {
    this.viajeRepository = repository;
    this.observer = observer;
  }

  async create(data: Omit<Viaje, 'id' | 'estado' | 'fechaCreacion'> & { criterio?: string }): Promise<Viaje> {
    const { criterio, ...viajeData } = data;

    // Calcular ruta usando el patrón Strategy si se especifica un criterio
    let rutaInfo: any = {};
    if (criterio) {
      let estrategia;
      switch(criterio) {
        case 'segura': estrategia = new RutaMasSeguraStrategy(); break;
        case 'corta': estrategia = new RutaMenorDistanciaStrategy(); break;
        case 'rapida': 
        default: estrategia = new RutaMasRapidaStrategy(); break;
      }
      const calculadora = new RutaCalculadora(estrategia);
      const resultado = calculadora.ejecutarCalculo(viajeData.origen, viajeData.destino);
      rutaInfo = {
        rutaCriterio: resultado.criterio,
        rutaTiempoEstimado: resultado.tiempoEstimado,
        rutaDistancia: resultado.distancia,
        rutaPeajes: resultado.peajes,
        rutaCamino: resultado.camino
      };
    }

    const nuevo: Viaje = {
      ...viajeData,
      ...rutaInfo,
      id: uuidv4(),
      estado: 'Disponible',
      fechaCreacion: new Date(),
    };
    const viajeCreado = await this.viajeRepository.create(nuevo);
    
    // Observer Pattern: Notificamos evento de viaje creado
    this.observer.notificarViajeCreado(viajeCreado);
    
    return viajeCreado;
  }

  async getAll(): Promise<Viaje[]> {
    return await this.viajeRepository.findAll();
  }

  async update(id: string, data: Partial<Viaje>): Promise<Viaje | null> {
    return await this.viajeRepository.update(id, data);
  }

  async assignTransportista(viajeId: string, transportistaId: string): Promise<Viaje | null> {
    const actualizado = await this.viajeRepository.update(viajeId, { 
      transportistaId, 
      estado: 'Asignado' 
    });
    if (actualizado) {
      this.observer.notificarViajeAsignado(actualizado);
    }
    return actualizado;
  }

  async cancel(id: string): Promise<Viaje | null> {
    const actualizado = await this.viajeRepository.update(id, { estado: 'Cancelado' });
    if (actualizado) {
      this.observer.notificarViajeCancelado(actualizado);
    }
    return actualizado;
  }

  async reschedule(id: string, fechaProgramada: string): Promise<Viaje | null> {
    const actualizado = await this.viajeRepository.update(id, { 
      fechaProgramada
    });
    if (actualizado) {
      this.observer.notify('VIAJE_REPROGRAMADO', actualizado);
    }
    return actualizado;
  }

  async delete(id: string): Promise<boolean> {
    const success = await this.viajeRepository.delete(id);
    if (success) {
      this.observer.notify('VIAJE_ELIMINADO', { id });
    }
    return success;
  }
}
