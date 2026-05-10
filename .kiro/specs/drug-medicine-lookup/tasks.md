# Plan de Implementación: Consulta de Medicamentos (drug-medicine-lookup)

## Resumen

Implementación incremental de la plataforma móvil y web de consulta farmacéutica. Se construye desde la base de datos y la API REST hacia el frontend React Native, integrando búsqueda full-text, prospectos, interacciones y historial local. Cada tarea produce código funcional e integrado; no hay código huérfano.

## Tareas

- [x] 1. Configurar estructura del proyecto y tipos compartidos
  - Inicializar monorepo con workspaces: `packages/shared`, `apps/api`, `apps/mobile`
  - Crear interfaces TypeScript compartidas: `Medicine`, `ActiveIngredient`, `Presentation`, `Prospect`, `DrugInteraction`, `SearchResult`, `InteractionResult`, `HistoryEntry`, `FilterState`, `ApiError`
  - Configurar Vitest y fast-check en el workspace `packages/shared`
  - _Requisitos: 1.1, 2.4, 3.2, 4.1, 4.2_

- [x] 2. Implementar utilidad de normalización de texto
  - [x] 2.1 Implementar `normalizeText` en `packages/shared/src/utils/normalizeText.ts`
    - Convertir a minúsculas, eliminar diacríticos con NFD + regex `[\u0300-\u036f]`
    - Exportar la función para uso en frontend y backend
    - _Requisitos: 1.4, 2.1_

  - [x] 2.2 Escribir test de propiedad para `normalizeText`
    - **Propiedad 1: Normalización de texto es idempotente**
    - **Valida: Requisito 1.4**
    - Usar `fc.string()` con 100 iteraciones mínimas
    - Verificar que `normalizeText(x) === normalizeText(normalizeText(x))` para cualquier string

  - [x] 2.3 Escribir tests unitarios para `normalizeText`
    - Casos: tildes (á, é, ñ), mayúsculas, cadena vacía, caracteres especiales, números
    - _Requisitos: 1.4_

- [x] 3. Configurar base de datos PostgreSQL y esquema
  - Crear migraciones SQL para tablas: `active_ingredients`, `medicines`, `medicine_ingredients`, `prospects`, `drug_interactions`
  - Agregar índices GIN con `pg_trgm` en columnas `*_normalized`
  - Crear trigger PostgreSQL para mantener columnas `*_normalized` actualizadas en INSERT/UPDATE
  - Configurar `pg-mem` para tests de integración sin Docker
  - _Requisitos: 1.1, 1.4, 2.1, 3.2, 4.1, 4.2_

- [x] 4. Implementar capa de repositorio (backend)
  - [x] 4.1 Implementar `MedicineRepository` en `apps/api/src/repositories/medicineRepository.ts`
    - Métodos: `searchByActiveIngredient(query, filters, page)`, `searchByCommercialName(query, filters, page)`, `getSuggestions(query, type)`, `findById(id)`
    - Usar `normalizeText` para preparar el término antes de la query SQL con `%` y operador `%` de `pg_trgm`
    - Aplicar filtros opcionales: `laboratory`, `pharmaceuticalForm`, `requiresPrescription`
    - Implementar paginación con `LIMIT` y `OFFSET`; devolver `total`, `page`, `pageSize`, `totalPages`
    - _Requisitos: 1.1, 1.4, 1.6, 2.1, 2.4, 5.1, 5.2, 5.3_

  - [ ]* 4.2 Escribir test de propiedad para paginación
    - **Propiedad 3: La paginación cubre todos los resultados sin duplicados**
    - **Valida: Requisito 1.6**
    - Poblar `pg-mem` con N medicamentos aleatorios; recorrer todas las páginas y verificar que la unión es exactamente N elementos únicos y ninguna página supera 20 elementos

  - [ ]* 4.3 Escribir test de propiedad para filtros
    - **Propiedad 4: Los filtros son restrictivos y combinables**
    - **Valida: Requisitos 5.1, 5.3**
    - Generar combinaciones arbitrarias de filtros con `fc.record`; verificar que el resultado filtrado es subconjunto del resultado sin filtros y todos los elementos cumplen los criterios

  - [ ]* 4.4 Escribir test de propiedad para eliminación de filtros
    - **Propiedad 5: Eliminar todos los filtros restaura el resultado original**
    - **Valida: Requisito 5.4**
    - Verificar round-trip: resultado con filtros vacíos === resultado original de la búsqueda

  - [ ]* 4.5 Escribir tests unitarios para `MedicineRepository`
    - Búsqueda con tildes y mayúsculas devuelve los mismos resultados que sin ellas
    - Búsqueda sin resultados devuelve lista vacía y `total: 0`
    - Paginación con `pageSize=20` y distintos valores de `page`
    - _Requisitos: 1.3, 1.4, 1.6, 2.3_

- [x] 5. Implementar repositorio de prospectos e interacciones (backend)
  - [x] 5.1 Implementar `ProspectRepository` en `apps/api/src/repositories/prospectRepository.ts`
    - Método: `findByMedicineId(medicineId): Promise<Prospect | null>`
    - Devolver `null` si no existe el prospecto para ese medicamento
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 5.2 Implementar `InteractionRepository` en `apps/api/src/repositories/interactionRepository.ts`
    - Método: `findInteractions(ingredientIds: string[]): Promise<DrugInteraction[]>`
    - Consultar pares (A, B) y (B, A) para garantizar simetría en la respuesta
    - _Requisitos: 4.1, 4.2_

  - [ ]* 5.3 Escribir test de propiedad para interacciones
    - **Propiedad 8: Las interacciones son simétricas y tienen severidad válida**
    - **Valida: Requisitos 4.1, 4.2**
    - Generar pares arbitrarios de ingredientes; verificar que si existe interacción (A,B) también existe (B,A) con misma severidad, y que `severity` ∈ `{'leve', 'moderada', 'grave'}`

  - [ ]* 5.4 Escribir tests unitarios para repositorios de prospectos e interacciones
    - Prospecto existente devuelve todos los campos requeridos
    - Prospecto inexistente devuelve `null`
    - Interacciones con lista vacía devuelve `[]`
    - _Requisitos: 3.2, 3.3, 4.1, 4.3_

- [x] 6. Implementar servicios de dominio (backend)
  - [x] 6.1 Implementar `SearchService` en `apps/api/src/services/searchService.ts`
    - Orquestar `MedicineRepository`; aplicar `normalizeText` al término de entrada
    - Devolver `SearchResult` con paginación
    - _Requisitos: 1.1, 1.2, 1.4, 1.6, 2.1, 2.2_

  - [x] 6.2 Implementar `ProspectService` en `apps/api/src/services/prospectService.ts`
    - Delegar en `ProspectRepository`; lanzar error `PROSPECT_NOT_FOUND` si `null`
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 6.3 Implementar `InteractionService` en `apps/api/src/services/interactionService.ts`
    - Recibir lista de `medicineIds`; resolver sus `activeIngredientIds` y delegar en `InteractionRepository`
    - Setear `exceedsRecommendedLimit: true` si se reciben más de 5 medicamentos
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.4 Escribir tests unitarios para los servicios de dominio
    - `SearchService`: término < 3 caracteres lanza `QUERY_TOO_SHORT`
    - `ProspectService`: prospecto no encontrado lanza error correcto
    - `InteractionService`: más de 5 medicamentos activa `exceedsRecommendedLimit`
    - _Requisitos: 1.2, 3.3, 4.4_

- [x] 7. Implementar endpoints de la API REST (backend)
  - [x] 7.1 Crear router Express en `apps/api/src/routes/medicines.ts`
    - `GET /api/v1/medicines/search` — validar `q` (mín. 3 chars), `type`, `page`, `pageSize`, filtros y `sort`; delegar en `SearchService`
    - `GET /api/v1/medicines/suggestions` — validar `q` (mín. 3 chars); devolver array de strings
    - `GET /api/v1/medicines/:id` — devolver detalle del medicamento
    - `GET /api/v1/medicines/:id/prospect` — devolver prospecto; manejar `PROSPECT_NOT_FOUND` con 404
    - _Requisitos: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Crear router Express en `apps/api/src/routes/interactions.ts`
    - `POST /api/v1/interactions/check` — validar body `{ medicineIds: string[] }`; delegar en `InteractionService`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.3 Agregar middleware de manejo de errores global
    - Mapear errores de dominio a códigos HTTP y estructura `ApiError`
    - Incluir `details` solo en entorno de desarrollo
    - Implementar reintentos con backoff exponencial para errores 5xx en cliente HTTP externo
    - _Requisitos: 1.3, 2.3, 3.3, 4.4_

  - [ ]* 7.4 Escribir tests de integración para los endpoints
    - Usar `supertest` + `pg-mem`; cubrir casos principales y errores de cada endpoint
    - Verificar estructura de respuesta, códigos HTTP y mensajes de error
    - _Requisitos: 1.1, 1.3, 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 4.4_

- [x] 8. Punto de control — Verificar que todos los tests del backend pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 9. Implementar servicio de historial local (frontend)
  - [x] 9.1 Implementar `historyService` en `apps/mobile/src/services/historyService.ts`
    - Usar `AsyncStorage` para persistir entradas como JSON
    - Métodos: `addEntry(entry)`, `getEntries()`, `removeEntry(id)`, `clearAll()`
    - Al agregar: si hay 20 entradas, descartar la más antigua antes de insertar la nueva
    - Mantener orden cronológico inverso (más reciente primero)
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.2 Escribir test de propiedad para el historial
    - **Propiedad 6: El historial mantiene orden cronológico inverso y respeta el límite de 20 entradas**
    - **Valida: Requisitos 6.1, 6.2**
    - Generar secuencias arbitrarias de N entradas (N > 20); verificar que `getEntries()` devuelve ≤ 20 elementos ordenados de más reciente a más antiguo

  - [ ]* 9.3 Escribir tests unitarios para `historyService`
    - Agregar entrada: aparece al inicio de la lista
    - Agregar más de 20 entradas: la lista no supera 20 elementos
    - Eliminar entrada individual: la entrada desaparece
    - `clearAll`: la lista queda vacía
    - _Requisitos: 6.1, 6.2, 6.4_

- [x] 10. Implementar stores de estado (frontend)
  - Crear `searchStore` con Zustand: estado `query`, `results`, `isLoading`, `error`, `filters`, `currentPage`
  - Crear `filterStore` con Zustand: estado `activeFilters`, acciones `setFilter`, `clearFilters`
  - Crear `interactionStore` con Zustand: estado `selectedMedicines`, `interactionResult`, acciones `addMedicine`, `removeMedicine`, `checkInteractions`
  - _Requisitos: 1.1, 1.6, 4.1, 5.1, 5.2, 5.3, 5.4_

- [x] 11. Implementar servicios de API (frontend)
  - Implementar `searchService` en `apps/mobile/src/services/searchService.ts`
    - Métodos: `searchByActiveIngredient`, `searchByCommercialName`, `getSuggestions`
    - Timeout de 10 segundos; 2 reintentos con backoff exponencial para errores 5xx
    - _Requisitos: 1.1, 1.2, 1.4, 2.1, 2.2_
  - Implementar `prospectService` en `apps/mobile/src/services/prospectService.ts`
    - Método: `getProspect(medicineId)`
    - _Requisitos: 3.1, 3.2, 3.3_
  - Implementar `interactionService` en `apps/mobile/src/services/interactionService.ts`
    - Método: `checkInteractions(medicineIds)`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_
  - Integrar detección de conectividad con `NetInfo`; exponer estado `isConnected` en los servicios
    - _Requisitos: 7.5_

- [x] 12. Implementar componentes UI base (frontend)
  - [x] 12.1 Implementar `SearchBar` en `apps/mobile/src/components/SearchBar.tsx`
    - Input controlado; disparar `getSuggestions` al escribir ≥ 3 caracteres con debounce de 300ms
    - Mostrar lista de sugerencias desplegable; accesible con roles ARIA en web
    - _Requisitos: 1.2, 1.4, 2.2, 7.4_

  - [x] 12.2 Implementar `MedicineCard` en `apps/mobile/src/components/MedicineCard.tsx`
    - Mostrar: nombre comercial, principio(s) activo(s), laboratorio, presentaciones
    - Accesible: `accessibilityLabel` descriptivo
    - _Requisitos: 2.4, 7.4_

  - [x] 12.3 Implementar `InteractionBadge` en `apps/mobile/src/components/InteractionBadge.tsx`
    - Mostrar nivel de severidad con color diferenciado: leve (amarillo), moderada (naranja), grave (rojo)
    - Cumplir contraste WCAG 2.1 AA
    - _Requisitos: 4.2, 7.4_

  - [x] 12.4 Implementar `FilterPanel` en `apps/mobile/src/components/FilterPanel.tsx`
    - Controles para filtrar por laboratorio, forma farmacéutica y condición de venta
    - Control de ordenamiento alfabético ascendente/descendente
    - Botón "Limpiar filtros" que dispara `clearFilters` en `filterStore`
    - _Requisitos: 5.1, 5.2, 5.4_

  - [ ]* 12.5 Escribir tests de propiedad para búsqueda insensible a tildes/mayúsculas (frontend)
    - **Propiedad 2: La búsqueda es insensible a mayúsculas y tildes**
    - **Valida: Requisito 1.4**
    - Generar términos arbitrarios; verificar que buscar el original, su versión en mayúsculas y sin tildes produce el mismo conjunto de resultados (usando mock del servicio)

  - [ ]* 12.6 Escribir tests unitarios para componentes UI
    - `MedicineCard`: renderiza todos los campos requeridos
    - `InteractionBadge`: renderiza color correcto para cada nivel de severidad
    - `FilterPanel`: botón "Limpiar filtros" llama a `clearFilters`
    - _Requisitos: 2.4, 4.2, 5.4_

- [x] 13. Implementar pantallas principales (frontend)
  - [x] 13.1 Implementar `SearchScreen` en `apps/mobile/src/screens/SearchScreen.tsx`
    - Integrar `SearchBar` con `searchStore`; mostrar mensaje de sin conexión si `!isConnected`
    - Navegar a `ResultsScreen` al confirmar búsqueda
    - _Requisitos: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.5_

  - [x] 13.2 Implementar `ResultsScreen` en `apps/mobile/src/screens/ResultsScreen.tsx`
    - Renderizar lista de `MedicineCard`; integrar `FilterPanel` y `filterStore`
    - Paginación: botón "Cargar más" o scroll infinito que incrementa `currentPage`
    - Mensaje "No se encontraron medicamentos" cuando `results` está vacío
    - _Requisitos: 1.3, 1.6, 2.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 13.3 Implementar `ProspectScreen` en `apps/mobile/src/screens/ProspectScreen.tsx`
    - Mostrar todas las secciones del prospecto con índice de contenidos navegable
    - Manejar estado de carga y error `PROSPECT_NOT_FOUND` con mensaje apropiado
    - Botón de exportar/imprimir PDF (condicional según capacidad del dispositivo)
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 13.4 Implementar `InteractionsScreen` en `apps/mobile/src/screens/InteractionsScreen.tsx`
    - Selector de medicamentos integrado con `interactionStore`
    - Mostrar resultados con `InteractionBadge` por severidad
    - Mostrar aviso cuando se seleccionan más de 5 medicamentos
    - Mensaje "No se encontraron interacciones conocidas" cuando `interactions` está vacío
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 13.5 Implementar `HistoryScreen` en `apps/mobile/src/screens/HistoryScreen.tsx`
    - Listar entradas de `historyService` ordenadas de más reciente a más antigua
    - Acción por entrada: re-ejecutar consulta y navegar a `ResultsScreen`
    - Acciones: eliminar entrada individual, botón "Borrar historial completo"
    - _Requisitos: 6.2, 6.3, 6.4_

  - [ ]* 13.6 Escribir tests de propiedad para resultados de búsqueda
    - **Propiedad 7: Los resultados de búsqueda contienen la información requerida**
    - **Valida: Requisito 2.4**
    - Generar resultados arbitrarios de búsqueda; verificar que cada `Medicine` tiene `commercialName`, al menos un `activeIngredient`, `laboratory` y al menos una `presentation`

  - [ ]* 13.7 Escribir tests de propiedad para prospectos
    - **Propiedad 9: El prospecto contiene todas las secciones requeridas**
    - **Valida: Requisito 3.2**
    - Generar prospectos arbitrarios; verificar que todos los campos requeridos están presentes y no son `null` ni `undefined`

- [x] 14. Integrar historial en el flujo de búsqueda
  - Al confirmar una búsqueda en `SearchScreen`, llamar a `historyService.addEntry` con el término y tipo
  - Al seleccionar una entrada en `HistoryScreen`, llamar a `searchStore` con los parámetros guardados
  - _Requisitos: 6.1, 6.3_

- [x] 15. Configurar diseño responsivo y accesibilidad
  - Aplicar `StyleSheet` responsivo usando `Dimensions` y `useWindowDimensions` para adaptar layouts
  - Agregar `accessibilityRole`, `accessibilityLabel` y `accessibilityHint` a todos los elementos interactivos
  - Verificar contraste de colores con `axe-core` en la versión web
  - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 16. Punto de control final — Verificar que todos los tests pasan
  - Ejecutar suite completa de tests (unitarios, de propiedades e integración)
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los puntos de control garantizan validación incremental
- Los tests de propiedades usan `fast-check` con Vitest y un mínimo de 100 iteraciones
- Los tests unitarios complementan los tests de propiedades con casos concretos y condiciones de error
- El lenguaje de implementación es **TypeScript** en todo el stack (frontend y backend)
