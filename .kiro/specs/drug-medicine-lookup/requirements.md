# Documento de Requisitos

## Introducción

Esta funcionalidad consiste en una aplicación móvil y web que permite a los usuarios consultar información sobre medicamentos. Los usuarios pueden buscar medicamentos por droga o principio activo, consultar el prospecto completo de un medicamento y realizar otras consultas relacionadas, como interacciones, contraindicaciones y presentaciones disponibles. El objetivo es brindar acceso rápido y confiable a información farmacéutica para pacientes, cuidadores y profesionales de la salud.

## Glosario

- **Sistema**: La aplicación móvil y web de consulta de medicamentos.
- **Usuario**: Persona que utiliza el Sistema para consultar información farmacéutica.
- **Medicamento**: Producto farmacéutico identificado por nombre comercial y/o principio activo.
- **Principio_Activo**: Sustancia química responsable del efecto terapéutico de un medicamento (también llamada droga o molécula activa).
- **Prospecto**: Documento oficial que acompaña a un medicamento con información sobre indicaciones, posología, contraindicaciones, efectos adversos e interacciones.
- **Buscador**: Componente del Sistema que recibe términos de búsqueda y devuelve resultados relevantes.
- **Catálogo**: Base de datos de medicamentos y principios activos disponibles en el Sistema.
- **Resultado_de_Búsqueda**: Lista de medicamentos que coinciden con los criterios ingresados por el Usuario.

---

## Requisitos

### Requisito 1: Búsqueda de medicamentos por principio activo

**Historia de usuario:** Como usuario, quiero buscar medicamentos que contengan un determinado principio activo, para conocer todas las opciones disponibles que contienen la droga que necesito.

#### Criterios de aceptación

1. WHEN el Usuario ingresa el nombre de un principio activo en el Buscador, THE Sistema SHALL devolver todos los medicamentos del Catálogo que contienen dicho principio activo.
2. WHEN el Usuario ingresa un término de búsqueda con al menos 3 caracteres, THE Buscador SHALL mostrar sugerencias de principios activos en tiempo real mientras el Usuario escribe.
3. WHEN la búsqueda no produce resultados, THE Sistema SHALL mostrar un mensaje indicando que no se encontraron medicamentos para el principio activo ingresado.
4. WHEN el Usuario ingresa un término de búsqueda, THE Buscador SHALL realizar la búsqueda de forma insensible a mayúsculas, minúsculas y tildes.
5. THE Sistema SHALL permitir buscar medicamentos que contengan múltiples principios activos simultáneamente.
6. WHEN el Resultado_de_Búsqueda contiene más de 20 medicamentos, THE Sistema SHALL paginar los resultados mostrando un máximo de 20 medicamentos por página.

---

### Requisito 2: Búsqueda de medicamentos por nombre comercial

**Historia de usuario:** Como usuario, quiero buscar un medicamento por su nombre comercial, para encontrarlo rápidamente cuando ya conozco la marca.

#### Criterios de aceptación

1. WHEN el Usuario ingresa el nombre comercial de un medicamento en el Buscador, THE Sistema SHALL devolver los medicamentos del Catálogo cuyo nombre coincida total o parcialmente con el término ingresado.
2. WHEN el Usuario ingresa un término de búsqueda con al menos 3 caracteres, THE Buscador SHALL mostrar sugerencias de nombres comerciales en tiempo real.
3. WHEN la búsqueda no produce resultados, THE Sistema SHALL mostrar un mensaje indicando que no se encontraron medicamentos con ese nombre.
4. THE Resultado_de_Búsqueda SHALL mostrar para cada medicamento: nombre comercial, principio(s) activo(s), laboratorio fabricante y presentaciones disponibles.

---

### Requisito 3: Consulta del prospecto de un medicamento

**Historia de usuario:** Como usuario, quiero consultar el prospecto completo de un medicamento, para conocer sus indicaciones, posología, contraindicaciones y efectos adversos.

#### Criterios de aceptación

1. WHEN el Usuario selecciona un medicamento del Resultado_de_Búsqueda, THE Sistema SHALL mostrar el Prospecto completo de dicho medicamento.
2. THE Prospecto SHALL incluir las siguientes secciones: indicaciones terapéuticas, posología y forma de administración, contraindicaciones, advertencias y precauciones, interacciones medicamentosas, efectos adversos, sobredosis y condiciones de almacenamiento.
3. IF el Prospecto de un medicamento no está disponible en el Catálogo, THEN THE Sistema SHALL mostrar un mensaje indicando que el prospecto no se encuentra disponible y sugerir consultar al profesional de salud.
4. THE Sistema SHALL permitir al Usuario navegar entre las secciones del Prospecto mediante un índice de contenidos.
5. WHERE el dispositivo del Usuario soporta impresión, THE Sistema SHALL permitir imprimir o exportar el Prospecto en formato PDF.

---

### Requisito 4: Consulta de interacciones medicamentosas

**Historia de usuario:** Como usuario, quiero consultar las interacciones entre dos o más medicamentos, para conocer si es seguro tomarlos juntos.

#### Criterios de aceptación

1. WHEN el Usuario selecciona dos o más medicamentos para verificar interacciones, THE Sistema SHALL mostrar las interacciones conocidas entre los principios activos de los medicamentos seleccionados.
2. THE Sistema SHALL clasificar cada interacción con un nivel de severidad: leve, moderada o grave.
3. WHEN no se registran interacciones entre los medicamentos seleccionados, THE Sistema SHALL mostrar un mensaje indicando que no se encontraron interacciones conocidas.
4. IF el Usuario selecciona más de 5 medicamentos para verificar interacciones, THEN THE Sistema SHALL mostrar un aviso indicando que el análisis puede ser incompleto y recomendar consultar a un profesional de salud.

---

### Requisito 5: Filtrado y ordenamiento de resultados

**Historia de usuario:** Como usuario, quiero filtrar y ordenar los resultados de búsqueda, para encontrar más fácilmente el medicamento que necesito.

#### Criterios de aceptación

1. THE Sistema SHALL permitir al Usuario filtrar el Resultado_de_Búsqueda por: laboratorio fabricante, forma farmacéutica (comprimido, jarabe, inyectable, etc.) y condición de venta (con receta, sin receta).
2. THE Sistema SHALL permitir al Usuario ordenar el Resultado_de_Búsqueda por nombre comercial en orden alfabético ascendente o descendente.
3. WHEN el Usuario aplica uno o más filtros, THE Sistema SHALL actualizar el Resultado_de_Búsqueda mostrando únicamente los medicamentos que cumplen todos los criterios seleccionados.
4. WHEN el Usuario elimina todos los filtros, THE Sistema SHALL restaurar el Resultado_de_Búsqueda completo correspondiente a la búsqueda original.

---

### Requisito 6: Historial de consultas

**Historia de usuario:** Como usuario, quiero acceder a mi historial de consultas recientes, para volver a consultar medicamentos que ya busqué anteriormente sin tener que escribir de nuevo.

#### Criterios de aceptación

1. THE Sistema SHALL registrar localmente en el dispositivo del Usuario las últimas 20 consultas realizadas.
2. WHEN el Usuario accede a la sección de historial, THE Sistema SHALL mostrar las consultas ordenadas de la más reciente a la más antigua.
3. WHEN el Usuario selecciona una entrada del historial, THE Sistema SHALL ejecutar nuevamente esa consulta y mostrar los resultados actualizados.
4. THE Sistema SHALL permitir al Usuario eliminar entradas individuales del historial o borrar el historial completo.
5. IF el Usuario desinstala la aplicación móvil, THEN THE Sistema SHALL eliminar el historial de consultas almacenado localmente.

---

### Requisito 7: Accesibilidad y compatibilidad

**Historia de usuario:** Como usuario, quiero que la aplicación sea accesible y funcione correctamente en distintos dispositivos, para poder consultarla desde cualquier plataforma.

#### Criterios de aceptación

1. THE Sistema SHALL ser compatible con navegadores web modernos: Chrome, Firefox, Safari y Edge en sus versiones publicadas en los últimos 2 años.
2. THE Sistema SHALL ser compatible con dispositivos móviles con sistema operativo iOS 15 o superior y Android 10 o superior.
3. THE Sistema SHALL adaptar su interfaz al tamaño de pantalla del dispositivo del Usuario mediante diseño responsivo.
4. THE Sistema SHALL cumplir con las pautas de accesibilidad WCAG 2.1 nivel AA para garantizar el acceso a usuarios con discapacidades visuales o motoras.
5. WHEN el dispositivo del Usuario no tiene conexión a internet, THE Sistema SHALL mostrar un mensaje indicando que se requiere conexión para realizar consultas.
