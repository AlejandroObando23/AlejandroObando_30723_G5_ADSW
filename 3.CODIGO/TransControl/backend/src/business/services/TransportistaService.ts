import { Transportista } from '../../domain/entities/Transportista';
import { ITransportistaRepository } from '../../domain/interfaces/ITransportistaRepository';
import { v4 as uuidv4 } from 'uuid';

export class TransportistaService {
  private transportistaRepository: ITransportistaRepository;

  constructor(repository: ITransportistaRepository) {
    // Inyección de dependencias (Repository Pattern)
    this.transportistaRepository = repository;
  }

  async create(data: Omit<Transportista, 'id'>): Promise<Transportista> {
    const nuevo: Transportista = {
      ...data,
      id: uuidv4(),
    };
    return await this.transportistaRepository.create(nuevo);
  }

  async getAll(): Promise<Transportista[]> {
    return await this.transportistaRepository.findAll();
  }

  async getById(id: string): Promise<Transportista | null> {
    return await this.transportistaRepository.findById(id);
  }

  async update(id: string, data: Partial<Transportista>): Promise<Transportista | null> {
    return await this.transportistaRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.transportistaRepository.delete(id);
  }
}
