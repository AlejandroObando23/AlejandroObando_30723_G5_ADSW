import { Auditoria } from '../../domain/entities/Auditoria';
import { JsonStorage } from '../storage/JsonStorage';
import { ISystemObserver } from '../../domain/observer/SystemObserver';
import { v4 as uuidv4 } from 'uuid';

export class JsonAuditoriaAdapter implements ISystemObserver {
  private storage: JsonStorage<Auditoria>;

  constructor() {
    this.storage = new JsonStorage('auditoria.json');
  }

  async log(accion: string, modulo: string, usuario: string = 'Sistema') {
    const data = await this.storage.readAll();
    data.push({
      id: uuidv4(),
      accion,
      modulo,
      fecha: new Date(),
      usuario
    });
    await this.storage.writeAll(data);
  }

  update(event: string, data: any): void {
    this.log(`Evento disparado: ${event}`, 'SistemaObserver');
  }
}
