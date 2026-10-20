# Sistema de Comités y Actas

Este sistema permite a los agentes de IA (y desarrolladores) coordinar el trabajo entre diferentes módulos o sesiones, registrar decisiones arquitectónicas y mantener un historial claro de lo realizado sin depender de herramientas propietarias ni generar sobrecarga.

## Propósito

Compartir el contexto de trabajo, documentar decisiones y dejar el estado del código claro para que los siguientes agentes continúen sin duplicar tareas ni contradecir decisiones previas.

## Estructura

- `docs/committees/README.md`: Este documento explicativo del sistema.
- `docs/committees/INDEX.md`: Índice cronológico y temático de las actas disponibles.
- `docs/committees/minutes/`: Directorio donde residen los archivos de actas individuales.

## Cuándo convocar un comité

Convoca un comité cuando sea necesario:
- Coordinar el trabajo entre varios módulos, subsistemas o dependencias.
- Tomar o acordar decisiones que afecten la arquitectura o interfaces públicas.
- Resolver contradicciones entre decisiones previas y la implementación actual.
- Distribuir o secuenciar tareas complejas entre múltiples agentes o sesiones.

> **Importante**: No convoques comités para cambios rutinarios, tareas menores o modificaciones aisladas sin impacto arquitectónico.

## Cómo realizar el comité

1. **Multidisciplinar / Multiagente**: Si el entorno soporta subagentes o múltiples instancias, involucra a las áreas afectadas.
2. **Agente único**: Si solo opera un agente, realiza una revisión reflexiva y estructurada desde los distintos ángulos técnicos (arquitectura, tipos, pruebas, compatibilidad), indicando explícitamente en el acta que fue una revisión individual (sin simular identidades falsas).
3. **Puntos esenciales a cubrir**:
   - Objetivo y problema a resolver.
   - Trabajo actual y contexto existente.
   - Decisiones acordadas y su justificación técnica.
   - Módulos y archivos involucrados.
   - Riesgos, dependencias o conflictos identificados.
   - Próximos pasos y tareas pendientes.

## Procedimiento para agentes

### Al iniciar una tarea
1. Consulta `docs/committees/INDEX.md`.
2. Lee las actas relevantes para el área o tarea en curso.
3. Verifica el estado del código frente a las actas antes de modificarlo si detectas inconsistencias.

### Al concluir una tarea relevante
1. Redacta el acta en `docs/committees/minutes/AAAA-MM-DD-<tema-descriptivo>.md` siguiendo la plantilla.
2. Actualiza `docs/committees/INDEX.md` con la entrada correspondiente y un resumen breve.
3. Asegúrate de registrar únicamente hechos y pruebas efectivamente ejecutadas.
