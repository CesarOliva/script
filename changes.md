# Registro de cambios

## Tablas del modo paso a paso igualadas a `Tabs.tsx` ✅

Las vistas **Lexer** y **Símbolos** de `src/components/StepDebugger.tsx` usan ahora los mismos formatos que las tabs de `src/components/Tabs.tsx`:

- **Tabla Tokens** — columnas `#`, `Tipo`, `Lexema`, `Ubicación`.
- **Tabla Símbolos** — columnas `Nombre`, `Tipo`, `Kind`, `Scope`.
- Columna `Tipo` con píldoras de colores de `tokenTypeColors` (`src/components/styles.tsx`).
- Encabezados `th` fijos (`sticky`) en ambas tablas.
- Filas de token `ERROR` resaltadas en rojo; se conserva el resaltado ámbar de la línea activa del paso.
