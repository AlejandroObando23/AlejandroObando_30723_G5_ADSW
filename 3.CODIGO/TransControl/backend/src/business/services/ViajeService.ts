import { Viaje } from '../../domain/entities/Viaje';
import { IViajeRepository } from '../../domain/interfaces/IViajeRepository';
import { ViajeSubject } from '../../domain/observer/travel_observer';
import { v4 as uuidv4 } from 'uuid';

export class ViajeService {
  private viajeRepository: IViajeRepository;
  private observer: ViajeSubject;

  constructor(repository: IViajeRepository, observer: ViajeSubject) {
    this.viajeRepository = repository;
    this.observer = observer;
  }

  async create(data: Omit<Viaje, 'id' | 'estado' | 'fechaCreacion'>): Promise<Viaje> {
    const nuevo: Viaje = {
      ...data,
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
}
