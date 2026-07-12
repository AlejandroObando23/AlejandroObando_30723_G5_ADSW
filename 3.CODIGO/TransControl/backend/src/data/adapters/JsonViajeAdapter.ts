import { Viaje } from '../../domain/entities/Viaje';
import { IViajeRepository } from '../../domain/interfaces/IViajeRepository';
import { JsonStorage } from '../storage/JsonStorage';

/*
 * PATRÓN ADAPTER: ADAPTADOR (CONCRETE ADAPTER)
 * ==========================================
 * Actúa como puente entre la interfaz de dominio (IViajeRepository) y el
 * almacenamiento físico en disco (JsonStorage). La capa de negocio interactúa 
 * con este adaptador sin preocuparse de si los datos se guardan en un archivo .json 
 * o en una base de datos compleja.
 *
 * NOTA DE MIGRACIÓN:
 * Para migrar a Prisma/PostgreSQL, crea PrismaViajeAdapter que implemente IViajeRepository.
 * No necesitarás modificar la capa de negocio (ViajeService), 
 * solo inyectar el nuevo adaptador en su lugar.
 */
export class JsonViajeAdapter implements IViajeRepository {
  private storage: JsonStorage<Viaje>;

  constructor() {
    this.storage = new JsonStorage<Viaje>('viajes.json');
  }

  async create(viaje: Viaje): Promise<Viaje> {
    const data = await this.storage.readAll();
    data.push(viaje);
    await this.storage.writeAll(data);
    return viaje;
  }

  async update(id: string, viaje: Partial<Viaje>): Promise<Viaje | null> {
    const data = await this.storage.readAll();
    const index = data.findIndex(v => v.id === id);
    if (index === -1) return null;

    const updated = { ...data[index], ...viaje };
    data[index] = updated;
    await this.storage.writeAll(data);
    return updated;
  }

  async findById(id: string): Promise<Viaje | null> {
    const data = await this.storage.readAll();
    return data.find(v => v.id === id) || null;
  }

  async findAll(): Promise<Viaje[]> {
    return await this.storage.readAll();
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.storage.readAll();
    const index = data.findIndex(v => v.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    await this.storage.writeAll(data);
    return true;
  }
}
