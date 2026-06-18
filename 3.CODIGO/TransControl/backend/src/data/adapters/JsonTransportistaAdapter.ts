import { Transportista } from '../../domain/entities/Transportista';
import { ITransportistaRepository } from '../../domain/interfaces/ITransportistaRepository';
import { JsonStorage } from '../storage/JsonStorage';

/* 
 * NOTA DE MIGRACIÓN: 
 * Para migrar a Prisma, crea un archivo PrismaTransportistaAdapter.ts 
 * que implemente ITransportistaRepository usando prisma.transportista.create(), etc.
 * Luego, en el contenedor de inyección de dependencias o en los servicios, 
 * simplemente cambia la instancia de JsonTransportistaAdapter por PrismaTransportistaAdapter.
 */
export class JsonTransportistaAdapter implements ITransportistaRepository {
  private storage: JsonStorage<Transportista>;

  constructor() {
    this.storage = new JsonStorage<Transportista>('transportistas.json');
  }

  async create(transportista: Transportista): Promise<Transportista> {
    const data = await this.storage.readAll();
    data.push(transportista);
    await this.storage.writeAll(data);
    return transportista;
  }

  async update(id: string, transportista: Partial<Transportista>): Promise<Transportista | null> {
    const data = await this.storage.readAll();
    const index = data.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updated = { ...data[index], ...transportista };
    data[index] = updated;
    await this.storage.writeAll(data);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.storage.readAll();
    const index = data.findIndex(t => t.id === id);
    if (index === -1) return false;

    data.splice(index, 1);
    await this.storage.writeAll(data);
    return true;
  }

  async findById(id: string): Promise<Transportista | null> {
    const data = await this.storage.readAll();
    return data.find(t => t.id === id) || null;
  }

  async findAll(): Promise<Transportista[]> {
    return await this.storage.readAll();
  }
}
