import { Documento } from '../../domain/entities/Documento';
import { IDocumentoRepository } from '../../domain/interfaces/IDocumentoRepository';
import { JsonStorage } from '../storage/JsonStorage';

export class JsonDocumentoAdapter implements IDocumentoRepository {
  private storage: JsonStorage<Documento>;

  constructor() {
    this.storage = new JsonStorage<Documento>('documentos.json');
  }

  async create(documento: Documento): Promise<Documento> {
    const data = await this.storage.readAll();
    data.push(documento);
    await this.storage.writeAll(data);
    return documento;
  }

  async findAll(): Promise<Documento[]> {
    return await this.storage.readAll();
  }

  async findById(id: string): Promise<Documento | null> {
    const data = await this.storage.readAll();
    return data.find(d => d.id === id) || null;
  }

  async findByTransportistaId(transportistaId: string): Promise<Documento[]> {
    const data = await this.storage.readAll();
    return data.filter(d => d.transportistaId === transportistaId);
  }

  async update(id: string, data: Partial<Documento>): Promise<Documento | null> {
    const all = await this.storage.readAll();
    const idx = all.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    await this.storage.writeAll(all);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.storage.readAll();
    const idx = all.findIndex(d => d.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await this.storage.writeAll(all);
    return true;
  }
}
