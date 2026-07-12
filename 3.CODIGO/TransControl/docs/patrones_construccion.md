# 🛠️ Manual de Implementación de Patrones de Diseño — TransControl

Este documento es una guía práctica de construcción que detalla cómo están implementados físicamente los **Patrones de Diseño** en el código de **TransControl** y cómo un desarrollador puede interactuar con ellos, extenderlos o modificarlos.

---

## 1. Implementación Físicas: Patrón Observer

El patrón Observer en TransControl se implementa en dos partes: la infraestructura base y las implementaciones del dominio del negocio.

### 1.1. La Base Genérica (`SystemObserver.ts`)
En [SystemObserver.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/domain/observer/SystemObserver.ts) se definen los tipos e interfaces base:

```typescript
export interface ISystemObserver {
  update(event: string, data: any): void;
}

export class SystemSubject {
  private observers: ISystemObserver[] = [];

  attach(observer: ISystemObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: ISystemObserver): void {
    const idx = this.observers.indexOf(observer);
    if (idx !== -1) this.observers.splice(idx, 1);
  }

  notify(event: string, data: any): void {
    for (const obs of this.observers) {
      obs.update(event, data);
    }
  }
}
```

### 1.2. El Sujeto y Observers del Viaje (`travel_observer.ts`)
En [travel_observer.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/domain/observer/travel_observer.ts) se especializa el sujeto para los Viajes:

```typescript
import { ISystemObserver, SystemSubject } from './SystemObserver';

// Observador concreto para el Coordinador
export class CoordinadorObserver implements ISystemObserver {
  update(event: string, data: any): void {
    if (['VIAJE_CREADO', 'VIAJE_CANCELADO', 'DESVIO_RUTA'].includes(event)) {
      console.log(`[CoordinadorObserver] Alerta recibida: ${event} para el viaje ${data.id}.`);
    }
  }
}

// Sujeto Observable concreto
export class ViajeSubject extends SystemSubject {
  constructor() {
    super();
    // Auto-suscripción de observadores predeterminados
    this.attach(new CoordinadorObserver());
    this.attach(new SecretariaObserver());
    this.attach(new TransportistaObserver());
  }

  notificarViajeCreado(viaje: any) { this.notify('VIAJE_CREADO', viaje); }
  notificarViajeAsignado(viaje: any) { this.notify('VIAJE_ASIGNADO', viaje); }
  notificarViajeCancelado(viaje: any) { this.notify('VIAJE_CANCELADO', viaje); }
}
```

### 1.3. Disparador de Eventos (`ViajeService.ts`)
El servicio [ViajeService.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/business/services/ViajeService.ts) no conoce qué observadores existen. Solo recibe la instancia de `ViajeSubject` mediante inyección de dependencias e invoca las notificaciones:

```typescript
export class ViajeService {
  constructor(
    private viajeRepository: IViajeRepository,
    private observer: ViajeSubject
  ) {}

  async create(data: any) {
    const viajeCreado = await this.viajeRepository.create(data);
    // Disparar evento de forma desacoplada
    this.observer.notificarViajeCreado(viajeCreado);
    return viajeCreado;
  }
}
```

---

## 2. Implementación Física: Patrón Strategy

La flexibilidad algorítmica para el cálculo de rutas se implementa en [route_strategy.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/business/strategies/route_strategy.ts).

### 2.1. Las Estrategias Concretas y la Interfaz
```typescript
export interface RouteStrategy {
  calcularRuta(origen: string, destino: string): any;
}

export class RutaMasRapidaStrategy implements RouteStrategy {
  calcularRuta(origen: string, destino: string) {
    return { criterio: 'Rápida', tiempoEstimado: '4 horas', camino: 'Autopista...' };
  }
}

export class RutaMasSeguraStrategy implements RouteStrategy {
  calcularRuta(origen: string, destino: string) {
    return { criterio: 'Segura', tiempoEstimado: '5.5 horas', camino: 'Troncal Vigilada...' };
  }
}
```

### 2.2. El Contexto
El contexto `RutaCalculadora` mantiene una referencia interna a la estrategia:
```typescript
export class RutaCalculadora {
  private estrategia: RouteStrategy;

  constructor(estrategia: RouteStrategy) {
    this.estrategia = estrategia;
  }

  setEstrategia(estrategia: RouteStrategy) {
    this.estrategia = estrategia;
  }

  ejecutarCalculo(origen: string, destino: string) {
    return this.estrategia.calcularRuta(origen, destino);
  }
}
```

### 2.3. Ejecución Dinámica en el Controlador (`ViajeController.ts`)
El cliente selecciona el criterio por el payload JSON, y el controlador decide qué estrategia instanciar:
```typescript
// En ViajeController.simularRuta:
const { origen, destino, criterio } = req.body;
let estrategia: RouteStrategy;

switch(criterio) {
  case 'segura': estrategia = new RutaMasSeguraStrategy(); break;
  case 'corta': estrategia = new RutaMenorDistanciaStrategy(); break;
  case 'rapida': 
  default: estrategia = new RutaMasRapidaStrategy(); break;
}

const calculadora = new RutaCalculadora(estrategia);
const resultado = calculadora.ejecutarCalculo(origen, destino);
res.json(resultado);
```

---

## 3. Implementación Física: Patrón Adapter

Los adaptadores de persistencia permiten aislar la lectura/escritura de archivos físicos.

### 3.1. El Adaptado (Adaptee) (`JsonStorage.ts`)
[JsonStorage.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/data/storage/JsonStorage.ts) es la clase genérica encargada de interactuar físicamente con los archivos JSON en el disco duro mediante la API nativa `fs` de Node.js:
```typescript
import fs from 'fs/promises';
export class JsonStorage<T> {
  constructor(private filename: string) {}
  async readAll(): Promise<T[]> { ... }
  async writeAll(data: T[]): Promise<void> { ... }
}
```

### 3.2. El Adaptador (Adapter) (`JsonTransportistaAdapter.ts`)
Adapta la interfaz `JsonStorage` a los contratos esperados por la capa de negocio (`ITransportistaRepository`).
```typescript
import { ITransportistaRepository } from '../../domain/interfaces/ITransportistaRepository';
import { JsonStorage } from '../storage/JsonStorage';

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
  // Implementación del resto de métodos de la interfaz...
}
```

---

## 4. Guías para Desarrolladores (Cómo extender los patrones)

### 4.1. Cómo agregar una nueva Estrategia de Ruta
1. Crear una nueva clase en [route_strategy.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/business/strategies/route_strategy.ts) que implemente `RouteStrategy`:
   ```typescript
   export class RutaEconomicaStrategy implements RouteStrategy {
     calcularRuta(origen: string, destino: string) {
       return { criterio: 'Económica', tiempoEstimado: '6 horas', peajes: 0 };
     }
   }
   ```
2. Agregar la opción en el enrutamiento/controlador en [ViajeController.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/presentation/controllers/ViajeController.ts) dentro de la función `simularRuta`:
   ```typescript
   case 'economica': estrategia = new RutaEconomicaStrategy(); break;
   ```

### 4.2. Cómo migrar el Almacenamiento a una Base de Datos Real (e.g., PostgreSQL con Prisma)
Para migrar el almacenamiento de transportistas sin alterar la lógica de negocio ni la capa de controladores:
1. Crear un nuevo archivo en adapters, por ejemplo `PrismaTransportistaAdapter.ts`:
   ```typescript
   import { ITransportistaRepository } from '../../domain/interfaces/ITransportistaRepository';
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   export class PrismaTransportistaAdapter implements ITransportistaRepository {
     async create(t: Transportista) {
       return await prisma.transportista.create({ data: t });
     }
     async findAll() {
       return await prisma.transportista.findMany();
     }
     // ... el resto de implementaciones ...
   }
   ```
2. Modificar el singleton en [TransportistaRepository.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20%283%29/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/data/repositories/TransportistaRepository.ts):
   ```typescript
   // DE: export const TransportistaRepository = new JsonTransportistaAdapter();
   // A:
   import { PrismaTransportistaAdapter } from '../adapters/PrismaTransportistaAdapter';
   export const TransportistaRepository = new PrismaTransportistaAdapter();
   ```
   **Listo.** La capa de negocio e interfaces REST no cambian en absoluto.
