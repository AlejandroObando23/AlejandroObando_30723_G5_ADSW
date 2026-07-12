# Plan de Pruebas - TransControl

Este documento describe el plan de pruebas diseñado para la plataforma de gestión y monitoreo de transporte **TransControl**. En él se especifican los objetivos, alcance, cronograma de ejecución con las fechas de realización de las tareas y casos de prueba clave para cada uno de los requisitos funcionales del sistema.

---

## 1. Introducción y Objetivos
El objetivo de este plan de pruebas es garantizar el correcto funcionamiento del sistema TransControl, validando que se cumplan las especificaciones funcionales y de seguridad definidas para el proyecto. 
Las pruebas se enfocan en:
* Asegurar que el flujo de autenticación, creación de cuentas y recuperación de contraseñas sea seguro y funcional.
* Verificar la correcta gestión de la flota de transportistas y su documentación asociada.
* Validar la planeación, asignación, monitoreo en tiempo real de los viajes y la generación precisa de reportes.

---

## 2. Requisitos a Evaluar y Mapeo Funcional
A continuación, se detalla la relación entre los requerimientos del proyecto y las funciones implementadas:

| Requisito | Función Asociada | Descripción |
| :--- | :--- | :--- |
| **REQ001 – Iniciar Sesión** | RF1 | Validación segura de credenciales, autenticación y manejo de errores. |
| **REQ002 – Crear Cuenta** | RF2 | Registro de nuevos usuarios mediante formularios persistentes. |
| **REQ003 – Recuperar Contraseña** | RF3 | Enlace de recuperación y restablecimiento seguro. |
| **REQ004 – Gestionar Transportistas** | RF4 | Creación, actualización de perfiles, disponibilidad y control de documentación. |
| **REQ005 – Gestionar Viajes** | RF5 | Planificación logística, asignación de conductores, horarios y vehículos. |
| **REQ006 – Monitorear Viajes** | RF6 | Visualización en tiempo real, mapas de rutas, estados y alertas satelitales. |
  **REQ007	Reportes y Planificación de Rutas

---
iNFORMACION ADICIONAL:
TAREA1: RF1	Permite validar de forma segura las credenciales de acceso, autenticar usuarios y contraseñas, y mostrar mensajes de error claros cuando el inicio de sesión falla.
TAREA2:  RF2	Permite registrar nuevos usuarios mediante un formulario que captura la información necesaria, almacenando los datos y asignando las credenciales correspondientes.
TAREA3: RF3	Permite restablecer contraseñas mediante un enlace de recuperación y un formulario seguro para que los usuarios recuperen el acceso a su cuenta.
TAREA4: RF4	Permite crear, registrar y actualizar la información de los transportistas, incluyendo datos operativos, documentación y estado de disponibilidad para la asignación de viajes.
TAREA5: RF5	Permite organizar la planificación de viajes registrando rutas, horarios, unidades y personal asignado, estructurando la operación logística antes de la salida.
TAREA: RF6	Permite visualizar en tiempo real los viajes activos, monitorear su progreso, detectar alertas oportunamente y verificar el cumplimiento de los tiempos establecidos.
TAREA7:: RF7	Permite generar reportes consolidados aplicando filtros por fechas, transportistas y estado de los viajes, facilitando el análisis del desempeño y la toma de decisiones.

## 3. Cronograma de Desarrollo y Pruebas
Las tareas de desarrollo y verificación de calidad fueron ejecutadas según el siguiente cronograma planificado:

| Identificador | Requisito / RF | Descripción de la Tarea | Fecha Inicio | Fecha Fin (Real) | Duración | Estado |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **TAREA 1** | REQ001 / RF1 | Validación y autenticación segura de accesos y visualización de errores. | 01/06/2026 | 05/06/2026 | 5 días | Completado |
| **TAREA 2** | REQ002 / RF2 | Formulario de registro de nuevos usuarios y asignación de credenciales. | 05/06/2026 | 09/06/2026 | 5 días | Completado |
| **TAREA 3** | REQ003 / RF3 | Mecanismo y flujos seguros de restablecimiento de contraseña. | 08/06/2026 | 12/06/2026 | 5 días | Completado |
| **TAREA 4** | REQ004 / RF4 | Registro, edición, disponibilidad y carga de documentos de transportistas. | 11/06/2026 | 14/06/2026 | 4 días | Completado |
| **TAREA 5** | REQ005 / RF5 | Planificación logística, asignación de unidades y registro de viajes. | 14/06/2026 | 17/06/2026 | 4 días | Completado |
| **TAREA 6** | REQ006 / RF6 | Panel de monitoreo satelital en tiempo real con sistema de alertas. | 16/06/2026 | 19/06/2026 | 4 días | Completado |

---

## 4. Estrategia y Tipos de Pruebas
Para asegurar la robustez del sistema, se adoptan los siguientes enfoques de pruebas:
1. **Pruebas Unitarias**: Verificación individual de componentes backend (servicios y repositorios) y lógica de estados en frontend.
2. **Pruebas de Integración**: Pruebas de interacción entre la API del backend y las vistas del frontend (ej. carga de archivos y envío de formularios).
3. **Pruebas Funcionales (Caja Negra)**: Verificación de flujos de extremo a extremo (E2E) basados en el comportamiento esperado por el usuario.
4. **Pruebas de Regresión**: Validación de que nuevos cambios (ej. eliminación de documentos o reprogramación de viajes) no alteren módulos previamente funcionales.

---

## 5. Diseño de Casos de Prueba

### REQ001 – Iniciar Sesión (RF1)
* **Caso de Prueba CP-001-01: Autenticación Exitosa**
  * *Entrada:* Correo electrónico y contraseña válidos en base de datos.
  * *Pasos:* 
    1. Navegar a `/login`.
    2. Introducir credenciales correctas.
    3. Hacer clic en "Ingresar".
  * *Resultado Esperado:* Redirección exitosa al `/dashboard` e inicio de sesión guardado.
* **Caso de Prueba CP-001-02: Credenciales Incorrectas**
  * *Entrada:* Correo existente, contraseña incorrecta.
  * *Pasos:*
    1. Introducir datos erróneos y hacer clic en "Ingresar".
  * *Resultado Esperado:* Mensaje de error visible ("Credenciales incorrectas") y permanencia en la página de login.

### REQ002 – Crear Cuenta (RF2)
* **Caso de Prueba CP-002-01: Registro Completo de Usuario**
  * *Entrada:* Nombres, apellidos, correo, contraseña, rol ("Administrador" o "Transportista").
  * *Pasos:*
    1. Ir a `/registro`.
    2. Completar todos los campos requeridos.
    3. Hacer clic en "Registrar".
  * *Resultado Esperado:* Mensaje de éxito, almacenamiento de credenciales en `usuarios.json` y redirección a login.

### REQ003 – Recuperar Contraseña (RF3)
* **Caso de Prueba CP-003-01: Envío de Enlace de Recuperación**
  * *Entrada:* Correo electrónico registrado en la base de datos.
  * *Pasos:*
    1. Ir a `/recuperar` o sección correspondiente.
    2. Ingresar el correo electrónico y presionar "Enviar".
  * *Resultado Esperado:* Alerta de éxito indicando que se ha enviado el correo o un enlace de restablecimiento.

### REQ004 – Gestionar Transportistas (RF4)
* **Caso de Prueba CP-004-01: Registro de Conductor con Documentación**
  * *Entrada:* Datos del transportista, subida de documentos oficiales (SOAT, Licencia).
  * *Pasos:*
    1. Navegar a "Gestionar Transportistas".
    2. Crear nuevo transportista.
    3. Subir archivos en formato PDF/PNG para su validación.
  * *Resultado Esperado:* Transportista creado con estado "Disponible" y documentos correctamente guardados en el disco e indexados en `documentos.json`.
* **Caso de Prueba CP-004-02: Eliminación de Documentos**
  * *Entrada:* ID de un documento existente.
  * *Pasos:*
    1. Ir a la pestaña "Documentación".
    2. Hacer clic en "Eliminar" en la fila del documento.
    3. Confirmar la ventana emergente.
  * *Resultado Esperado:* El documento se remueve de la interfaz, el registro es borrado de `documentos.json` y el archivo se borra físicamente de la carpeta de subidas.

### REQ005 – Gestionar Viajes (RF5)
* **Caso de Prueba CP-005-01: Creación de Viaje con Criterio de Ruta**
  * *Entrada:* Fecha, transportista asignado, origen/destino, estrategia de ruta (Ruta Más Rápida, Ruta Más Corta, Ecológica).
  * *Pasos:*
    1. Acceder a `/viajes/crear`.
    2. Seleccionar transportista de la lista (sincronizado con usuarios creados en login).
    3. Escoger un criterio de ruta.
    4. Confirmar creación del viaje.
  * *Resultado Esperado:* Registro del viaje con la ruta calculada según la estrategia elegida y envío de notificación en tiempo real al transportista asignado.

### REQ006 – Monitorear Viajes (RF6)
* **Caso de Prueba CP-006-01: Rastreo en Tiempo Real y Alertas**
  * *Entrada:* Viaje con estado "En Tránsito".
  * *Pasos:*
    1. Acceder como transportista o administrador al panel `/monitoreo`.
    2. Visualizar mapa de ruta y bitácora satelital.
  * *Resultado Esperado:* El mapa dibuja la trayectoria correctamente, y se observan las alertas de retraso o desvíos si se activan cambios de coordenadas.

---

## 6. Criterios de Aceptación y Cierre de Pruebas
Se dará por aprobado el ciclo de pruebas cuando se verifiquen los siguientes puntos:
1. **0 Errores Críticos (Bloqueantes):** El flujo principal de login, registro, asignación y monitoreo de viajes se ejecuta sin caídas de servidor.
2. **Cobertura del 100% de los Requisitos:** Cada uno de los 7 requisitos cuenta con al menos un caso de prueba verificado y exitoso.
3: **Persistencia Correcta:** Los datos manipulados en la interfaz (creaciones, reprogramaciones y eliminaciones) se sincronizan inmediatamente en los archivos JSON correspondientes.

---

## 7. Pruebas Unitarias del Backend (Vitest / BDD Jasmine-Style)

Se ha creado un conjunto de **23 pruebas unitarias** enfocadas en la lógica del negocio del backend. Estas pruebas están estructuradas bajo la metodología BDD (Behavior Driven Development) utilizando bloques descriptivos `describe` e `it` (estilo Jasmine / Jest), facilitando la lectura de especificaciones funcionales y resultados.

### Ubicación de los Archivos de Pruebas
Los archivos de pruebas se encuentran agrupados en la carpeta:
* **[backend/src/tests/](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20(3)/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/tests/)**
  * [AuthService.spec.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20(3)/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/tests/AuthService.spec.ts)
  * [DocumentoService.spec.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20(3)/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/tests/DocumentoService.spec.ts)
  * [TransportistaService.spec.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20(3)/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/tests/TransportistaService.spec.ts)
  * [ViajeService.spec.ts](file:///c:/Users/LENOVO/Documents/Nueva%20carpeta%20(3)/AlejandroObando_30723_G0_ADSW/3.CODIGO/TransControl/backend/src/tests/ViajeService.spec.ts)

---

### Lista de Pruebas Unitarias y Descripciones

#### 1. `AuthService` (Autenticación e inicio de sesión)
* **`registro()`**
  * `debería registrar un nuevo usuario transportista exitosamente y sincronizarlo`: Verifica que la creación de un nuevo conductor vía login inserte el registro de usuario y automáticamente llame al repositorio de transportistas para mantenerlos sincronizados.
  * `debería lanzar un error si la cédula ya está registrada`: Verifica que no se permitan cédulas duplicadas en el sistema.
  * `debería lanzar un error si el teléfono ya está registrado`: Previene teléfonos duplicados en el login de usuarios.
  * `debería lanzar un error si el correo electrónico ya está registrado`: Previene cuentas con el mismo correo electrónico.
* **`login()`**
  * `debería loguear exitosamente con credenciales válidas y retornar un JWT y datos del usuario`: Autentica al usuario mediante hashing de bcrypt y genera un token JWT correcto.
  * `debería lanzar error si el usuario no existe`: Retorna error cuando el correo no está registrado.
  * `debería lanzar error si la contraseña es incorrecta`: Retorna error cuando la contraseña suministrada no coincide con el hash guardado.

#### 2. `DocumentoService` (Gestión de Documentación)
* **`create()`**
  * `debería crear un documento asignando un ID único y un estado predeterminado si no se especifica`: Valida el auto-generado de IDs y el estado "Pendiente" por defecto.
* **`importFromJsonOrCsv()`**
  * `debería importar correctamente desde una cadena JSON`: Valida el análisis e inserción masiva a partir de archivos JSON cargados.
  * `debería importar correctamente desde un formato CSV`: Valida el mapeo de cabeceras, conversión a objetos y creación masiva a partir de un archivo plano CSV.
* **`delete()`**
  * `debería retornar false si el documento no existe`: Controla el intento de borrar un ID inexistente.
  * `debería borrar el archivo físico e invocar la eliminación en el repositorio si existe`: Valida que al borrar un documento, se invoque el borrado físico (`fs.unlink`) del archivo adjunto y se remueva el registro del JSON de almacenamiento.

#### 3. `TransportistaService` (Gestión de Transportistas)
* **`create()`**
  * `debería crear un transportista exitosamente si cumple con todas las restricciones de unicidad`: Valida inserción de transportistas sin duplicados.
  * `debería lanzar un error si la cédula ya está registrada para otro transportista`: Control de unicidad de documento de identidad nacional.
  * `debería lanzar un error si la placa del vehículo ya está registrada`: Previene que dos conductores tengan asignada la misma placa de camión/vehículo.
* **`update()`**
  * `debería actualizar los datos correctamente`: Valida la edición dinámica de datos operativos y perfiles.

#### 4. `ViajeService` (Planificación y Rutas)
* **`create()`**
  * `debería calcular la ruta usando la estrategia "rapida" (por defecto) y notificar la creación`: Comprueba el patrón Strategy aplicando cálculo de ruta rápida y notifica a los observadores adjuntos (patrón Observer).
  * `debería calcular la ruta usando la estrategia "segura"`: Aplica la estrategia de menor riesgo en carretera y calcula peajes.
  * `debería calcular la ruta usando la estrategia "corta"`: Aplica la estrategia de menor kilometraje entre origen y destino.
* **`assignTransportista()`**
  * `debería asignar transportista, cambiar estado a "Asignado" y notificar`: Vincula un conductor y notifica el evento `VIAJE_ASIGNADO` (para el envío de alertas Push/SMS).
* **`cancel()`**
  * `debería cambiar estado a "Cancelado" y notificar`: Cancela un viaje programado y dispara las alertas del Observer correspondientes.
* **`reschedule()`**
  * `debería actualizar la fecha programada del viaje y notificar`: Reprograma la salida del viaje y notifica el evento.
* **`delete()`**
  * `debería invocar delete en el repositorio y notificar la eliminación`: Remueve el viaje del almacén y notifica.

---

### Comandos de Ejecución

Para ejecutar las pruebas en la carpeta del backend (`/backend`):

* **Ejecutar Pruebas Unitarias (Modo Simple):**
  ```bash
  npm run test
  ```
* **Ejecutar en modo interactivo (Watch mode):**
  ```bash
  npm run test:watch
  ```
* **Generar Reporte de Cobertura (Coverage):**
  ```bash
  npm run coverage
  ```

---

### Reporte de Cobertura Obtenido (V8)
Tras la ejecución del comando `npm run coverage`, se obtuvo la siguiente cobertura del código del backend:

| Módulo / Archivo | % Sentencias | % Ramas | % Funciones | % Líneas |
| :--- | :---: | :---: | :---: | :---: |
| **Todos los archivos (Promedio)** | **80.34%** | **61.32%** | **72.34%** | **80.53%** |
| `business/services/AuthService.ts` | 69.23% | 60.00% | 71.42% | 66.66% |
| `business/services/DocumentoService.ts` | 90.19% | 66.66% | 90.90% | 88.88% |
| `business/services/TransportistaService.ts`| 62.16% | 53.33% | 53.33% | 64.28% |
| `business/services/ViajeService.ts` | 94.59% | 64.28% | 75.00% | 94.11% |
| `business/strategies/route_strategy.ts` | 88.88% | 100.00% | 83.33% | 88.88% |




iNFORMACION ADICIONAL:
