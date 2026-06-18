import fs from 'fs/promises';
import path from 'path';

export class JsonStorage<T> {
  private filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(__dirname, '..', 'datasource', filename);
  }

  private async ensureFileExists() {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, '[]', 'utf-8');
    }
  }

  async readAll(): Promise<T[]> {
    await this.ensureFileExists();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as T[];
  }

  async writeAll(data: T[]): Promise<void> {
    await this.ensureFileExists();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
