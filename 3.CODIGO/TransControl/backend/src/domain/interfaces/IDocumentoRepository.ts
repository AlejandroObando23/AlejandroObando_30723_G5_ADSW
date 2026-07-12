import { Documento } from '../entities/Documento';

export interface IDocumentoRepository {
  create(documento: Documento): Promise<Documento>;
  findAll(): Promise<Documento[]>;
  findById(id: string): Promise<Documento | null>;
  findByTransportistaId(transportistaId: string): Promise<Documento[]>;
  update(id: string, data: Partial<Documento>): Promise<Documento | null>;
  delete(id: string): Promise<boolean>;
}
