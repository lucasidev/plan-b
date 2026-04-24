# ADR-0025: .NET 10 como runtime target del backend

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Cuando arrancamos Fase 2 (implementación), hay que elegir qué versión de .NET va a ejecutar el backend. En abril 2026, las opciones relevantes son:

- **.NET 8 LTS** (release noviembre 2023): soporte hasta noviembre 2026. Maduro, ampliamente adoptado.
- **.NET 10 STS** (release noviembre 2025): soporte hasta mayo 2027 (18 meses, política STS). Último release GA con los features más recientes.
- **.NET 11 LTS**: release programado noviembre 2026. No disponible al momento de arrancar.

## Decisión

**.NET 10 STS** como target. Pin exacto en `global.json` con `rollForward: latestPatch`.

```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestPatch"
  }
}
```

## Alternativas consideradas

### A. .NET 8 LTS

Estable, ampliamente adoptado, soporte 36 meses hasta noviembre 2026. Opción "segura".

Descartada porque:

- Para un proyecto que arranca implementación en abril 2026, el horizonte de soporte de .NET 8 (terminá en ~7 meses) es más corto que el horizonte realista del proyecto (MVP + focus group + launch + post-launch iteraciones).
- Falta features relevantes: mejoras en minimal APIs (útiles para Carter + Wolverine), mejoras de Npgsql/EF Core 10 para Postgres, source generators más maduros (útiles para Wolverine), improvements de performance.
- Migrar de .NET 8 a .NET 10/11 post-facto es típicamente 1-2 días de trabajo. Arrancar en 8 no ahorra nada si eventualmente hay que migrar.

### B. Esperar .NET 11 LTS (noviembre 2026)

Planb arranca ahora, no en 7 meses. Descartada trivialmente por timing.

### C. .NET 9 STS

Ya es release "pasada" en abril 2026 (.NET 10 salió hace 5 meses). Descartada: .NET 10 es superset en features y correcciones.

## Consecuencias

**Positivas:**

- Features más recientes: EF Core 10 con mejor soporte Postgres (incluyendo pgvector integration), minimal APIs mejoradas, source generators más maduros, mejor AOT support.
- Alineado con Wolverine que requiere .NET 8+ pero tiene optimizaciones para .NET 10+.
- Performance general mejor que .NET 8 (cada release tiene improvements).
- Cuando .NET 11 LTS salga en noviembre 2026, la migración es trivial (typically 1-2 días para un codebase medio).

**Negativas:**

- STS significa soporte hasta mayo 2027. Si planb vive más allá de esa fecha sin upgrade, queda sin soporte de seguridad oficial.
- Algunos paquetes NuGet de nicho pueden no tener aún builds para .NET 10 (raro en abril 2026, ya es mainstream).

**Estrategia de upgrades futuros:**

- **Noviembre 2026**: cuando .NET 11 LTS salga, planear migración de 10 → 11 dentro del primer trimestre de 2027. Aprovechar el upgrade para ganar soporte LTS de 3 años.
- **Mayo 2027**: si por cualquier motivo no migramos, tenemos soporte de .NET 10 hasta entonces.

**Regla:**

> Proyectos nuevos en período entre dos LTS (como .NET 10 entre 8 y 11) justifican usar el STS más reciente. Migrar a LTS cuando esté disponible es planeado, no reactivo.

**Cuándo revisitar:**

- Si .NET 11 LTS se retrasa significativamente (improbable).
- Si hay incompatibilidades críticas con paquetes que usamos (Wolverine, Npgsql, pgvector-dotnet).
