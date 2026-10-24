# Estándares de Rendimiento y Experiencia de Usuario

Normas de calidad y diseño para componentes y herramientas en `dmtool`.

## Rendimiento y División de Código

- **Dynamic Imports por Pestaña**: Toda herramienta de panel o modal secundaria debe cargarse mediante `next/dynamic` con `ssr: false` si depende de almacenamiento del navegador o APIs cliente.
- **Minimización de Bundles**: Prohibir importaciones globales de librerías de iconos o utilidades completas. Utilizar optimización de árbol de dependencias (`optimizePackageImports`).
- **Recursos Estáticos**: Los archivos tipográficos y estáticos deben servirse comprimidos (`woff2`, Brotli/Gzip) con encabezados de caché inmutable cuando aplique.
- **Criterio de compleción**: El chunk inicial de `/` no debe importar componentes de pestañas inactivas (`MonsterCompendium`, `Spellbook`, `InitiativeTracker`, etc.).

## Experiencia de Usuario (UX / UI)

- **Diseño Mobile-First**:
  - Toda pantalla y modal debe ser completamente navegable en viewports desde 320px de ancho sin desbordamiento horizontal global.
  - Los contenedores deslizables deben usar `-webkit-overflow-scrolling: touch` y clases de safe-area (`env(safe-area-inset-bottom)`).
  - Los botones de acción rápida en móvil deben cumplir un target táctil mínimo de 40x40px.
- **Feedback Inmediato (Toasts)**:
  - Toda mutación o acción rápida (copiado de texto, exportación, sincronización forzada o reseteo) debe disparar una confirmación visual antes de 100ms.
  - Los toasts deben cerrarse automáticamente en 2.5-3 segundos o al hacer clic, sin bloquear la interacción con la interfaz.
- **Tema y Modo Oscuro**:
  - El tema por defecto debe derivarse de `prefers-color-scheme` si el usuario no tiene selección guardada (`dm-theme`).
  - La transición entre temas no debe causar parpadeos de hidratación (resuelto mediante script bloqueante en `<head>`).
- **Criterio de compleción**: Acciones como copiar al portapapeles o guardar datos muestran toast de confirmación; las pantallas se adaptan a 375px y 768px sin scroll horizontal descontrolado.
