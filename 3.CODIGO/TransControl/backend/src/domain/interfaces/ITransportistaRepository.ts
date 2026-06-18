import { Transportista } from '../entities/Transportista';

export interface ITransportistaRepository {
  create(transportista: Transportista): Promise<Transportista>;
  update(id: string, transportista: Partial<Transportista>): Promise<Transportista | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<Transportista | null>;
  findAll(): Promise<Transportista[]>;
}
