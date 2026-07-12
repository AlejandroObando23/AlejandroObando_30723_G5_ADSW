import { Viaje } from '../entities/Viaje';

export interface IViajeRepository {
  create(viaje: Viaje): Promise<Viaje>;
  update(id: string, viaje: Partial<Viaje>): Promise<Viaje | null>;
  findById(id: string): Promise<Viaje | null>;
  findAll(): Promise<Viaje[]>;
  delete(id: string): Promise<boolean>;
}
