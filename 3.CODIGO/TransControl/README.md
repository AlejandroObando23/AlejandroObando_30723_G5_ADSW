# 🚛 Pry_TransControl Web

> **Sistema web de gestión y monitoreo de transporte** desarrollado con React y Node.js (TypeScript)

---

## 📋 Descripción del Proyecto

**Pry_TransControl** es una aplicación web full-stack construida con **React (Frontend)** y **Node.js/Express (Backend)** que permite gestionar y monitorear operaciones de transporte de carga en Ecuador. La aplicación cubre el ciclo completo: desde el inicio de sesión hasta el seguimiento de viajes, gestión de transportistas, documentación y cálculos dinámicos de rutas.

---

## 👥 Equipo de Desarrollo

| Nombre | Rama Git | Rol |
|--------|----------|-----|
| Alejandro Obando | `Alejandro` | Modelado/ Integración / Testing  |
| Juan | `Juan` | Backend / Frontend / UI |
| Steven | `Steven` | Líder del proyecto/ Integración / Testing |

---

## 🏗️ Arquitectura (Backend)

El proyecto implementa una **Arquitectura de Tres Capas** y principios de Diseño Orientado al Dominio (DDD), separando claramente las responsabilidades del sistema:

| Capa | Carpeta | Responsabilidad |
|------|---------|----------------|
| 📦 **Capa de Datos** | `backend/src/data/` | Acceso y persistencia de datos (repositorios en memoria, adaptadores) |
| ⚙️ **Capa de Negocio** | `backend/src/business/` | Reglas de negocio, servicios principales, validaciones y estrategias |
| 🖥️ **Capa de Presentación** | `backend/src/presentation/` | Rutas (API REST) y Controladores para el cliente frontend |
| 🧠 **Capa de Dominio** | `backend/src/domain/` | Entidades puras, interfaces transversales y eventos (Observer) |

### Estructura de Archivos

```
TransControl/
├── backend/
│   └── src/
│       ├── business/
│       │   ├── services/       # Servicios de negocio (ViajeService, etc.)
│       │   ├── strategies/     # Patrón Strategy (Rutas)
│       │   └── validators/     # Esquemas de validación (Zod)
│       ├── data/
│       │   ├── adapters/       # Patrón Adapter (Auditoría)
│       │   └── repositories/   # Patrón Repository
│       ├── domain/
│       │   ├── entities/       # Entidades (Viaje, Transportista, etc.)
│       │   ├── factories/      # Patrón Factory
│       │   ├── interfaces/     # Contratos de repositorios
│       │   └── observer/       # Patrón Observer
│       └── presentation/
│           ├── controllers/    # Lógica de las peticiones HTTP
│           └── routes/         # Definición de rutas Express
└── frontend/
    └── src/
        ├── pages/              # Vistas de React (Dashboard, Viajes, etc.)
        └── services/           # Cliente HTTP (Axios)
```

---

## 🎨 Patrones de Diseño Implementados

### 👁️ Patrón Observer — `travel_observer.ts`

Permite que múltiples objetos sean **notificados automáticamente** cuando ocurre un evento en el sistema de viajes. Implementado en el dominio de backend con:

- **Subject (`ViajeSubject`):** Emite eventos como `viaje_creado`, `viaje_cancelado` y `viaje_asignado`.
- **Observers:** Tres observadores concretos que reaccionan pasivamente a los eventos sin interrumpir el flujo principal:
  - `CoordinadorObserver` — notifica al coordinador del sistema
  - `SecretariaObserver` — procesa registros administrativos
  - `TransportistaObserver` — notifica al transportista asignado

> **Por qué se implementó:** El proceso de creación o asignación de un viaje involucra enviar notificaciones a múltiples actores (Secretaría, Coordinador, Transportista). No queríamos que la función principal que guarda el viaje en la base de datos contenga toda esa lógica de envío de mensajes, ya que si un correo fallaba, el sistema entero colapsaba.
> **Beneficio:** Desacoplamiento total entre el servicio que crea los viajes y los sistemas de notificación periféricos.

---

### 🔀 Patrón Strategy — `route_strategy.ts`

Permite **cambiar el algoritmo de cálculo de rutas en tiempo de ejecución**, sin modificar el controlador que lo usa. Implementado con:

- **Interfaz (`RouteStrategy`):** Define el contrato `calcularRuta()`.
- **Estrategias concretas:**
  - `RutaMasRapidaStrategy` — prioriza el menor tiempo de viaje.
  - `RutaMasSeguraStrategy` — prioriza seguridad con vías troncales y destacamentos policiales.
  - `RutaMenorDistanciaStrategy` — prioriza la menor distancia en kilómetros.
- **Contexto (`RutaCalculadora`):** Usa la estrategia activa e invoca la simulación.

> **Por qué se implementó:** Las necesidades logísticas cambian (a veces urge la entrega, a veces se requiere evitar zonas de riesgo). Codificar estas tres lógicas distintas dentro de un bloque gigante de `if/else` haría que el sistema sea frágil y difícil de mantener a futuro.
> **Beneficio:** Se puede consultar el mejor criterio de ruta (rapidez, seguridad o distancia) dinámicamente y el código queda abierto a extenderse (Open/Closed Principle).

---

### 🔌 Patrón Adapter — `JsonAuditoriaAdapter.ts`

Permite **adaptar una interfaz o sistema externo para que trabaje en conjunto con nuestro sistema** sin modificar la lógica principal. Implementado en la capa de datos con:

- **Interfaz Objetivo (`ISystemObserver`):** El sistema central espera hablar con observadores genéricos.
- **Adaptador (`JsonAuditoriaAdapter`):** Actúa como un puente. Escucha los eventos del `ViajeSubject` y "traduce" esa información para guardarla físicamente en un archivo JSON usando la clase `JsonStorage`.
- **Adaptado (`JsonStorage`):** Lógica externa o de bajo nivel que sabe cómo escribir archivos en el disco, pero no entiende de "Eventos de Viajes".

> **Por qué se implementó:** El proyecto requería guardar un registro físico (logs) de todas las acciones importantes (auditoría), pero no queríamos que la base de datos o el servicio de Viajes se mezclara con la librería nativa `fs` de Node.js.
> **Beneficio:** Mantiene la pureza del dominio. Si mañana se quiere guardar la auditoría en la nube (AWS S3) en lugar de un archivo JSON, solo se crea un nuevo adaptador y el resto del sistema no se entera.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Rol | Uso |
|------------|-----|-----|
| **React** | Frontend | Construcción de interfaces interactivas (SPA) |
| **Node.js & Express** | Backend | Servidor API RESTful |
| **TypeScript** | Lenguaje | Tipado estático en Frontend y Backend |
| **React Bootstrap** | UI | Componentes y sistema de cuadrícula responsivo |
| **Zod** | Backend | Validación estricta de datos entrantes |

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos previos
- Node.js (v18+)
- Gestor de paquetes npm

### Pasos

1. **Clonar el repositorio y entrar a la carpeta**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd TransControl
   ```

2. **Instalar dependencias de todo el proyecto (Frontend y Backend)**
   ```bash
   npm run install:all
   ```

3. **Levantar la Aplicación Completa**
   ```bash
   npm run dev
   ```
   *Este comando levantará **mágicamente** tanto el Backend (puerto 3000) como el Frontend (puerto 5173) en la misma terminal de forma simultánea, y abrirá tu navegador web.*

---

## 📱 Funcionalidades Principales

- ✅ **Autenticación** — Interfaz de Login interactiva y moderna.
- ✅ **Dashboard** — Panel principal con métricas dinámicas y diseño premium.
- ✅ **Gestión de Viajes** — Planificación de rutas, asignación de transportistas y estados en tiempo real (Disponible, Asignado).
- ✅ **Gestión de Transportistas** — CRUD completo de transportistas (con validación de cédula ecuatoriana).
- ✅ **Monitoreo** — Mapa de control centrado en Ecuador.
- ✅ **Documentación** — Panel de carga y gestión de archivos.
- ✅ **Arquitectura Escalable** — Inyección de dependencias y patrones GoF (Observer, Strategy, Factory, Adapter).

---

## 📌 Historial de Versiones

| Versión | Fecha | Descripción de cambios |
|---------|-------|------------------------|
| `v1.0.0` | 2026-06-17 | 🎉 **Versión Inicial Completa.** Se implementó el rediseño premium del Frontend (React-Bootstrap) y la refactorización arquitectónica del Backend (Node/TypeScript). Se añadieron validaciones de negocio, CRUD de Transportistas con confirmación mediante Modales, asignación dinámica en Viajes, y se organizaron exitosamente los patrones Observer y Strategy en la capa de Dominio y Negocio. |

---

## 🌿 Estructura de Ramas

| Rama | Descripción |
|------|-------------|
| `main` | Rama principal con el código estable y versionado |
| `Juan` | Rama de desarrollo de Juan |
| `Alejandro` | Rama de desarrollo de Alejandro |
| `Steven` | Rama de desarrollo de Steven |

---

## 📄 Licencia

Proyecto académico — Universidad. Todos los derechos reservados © 2026.
