# ADR-0010: Threshold de auto-hide configurable por env var

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

La moderación es reactiva: las reseñas se publican y se revisan solo cuando alguien las reporta. Si una reseña problemática recibe múltiples reports mientras un moderador todavía no la atiende, no queremos que permanezca pública durante el delay (horas o días).

Solución: cuando `N` reports abiertos se acumulan sobre la misma reseña, el sistema la mueve automáticamente a `under_review` sin intervención humana. La pregunta es **dónde vive el número N** y **cómo se modifica**.

Con `N = 1` un solo usuario con mala intención esconde cualquier reseña. Con `N` muy alto, contenido claramente problemático permanece visible más tiempo del aceptable. El valor de arranque razonable es `3` (varios reporters independientes).

## Decisión

El threshold vive en un env var: `MODERATION_AUTO_HIDE_THRESHOLD`. El servicio de moderación lo lee vía `IConfiguration` al startup con default `3`. Dokploy (y cualquier runtime de container) puede override sin tocar código.

```csharp
public class ModerationService {
    private readonly int _autoHideThreshold;

    public ModerationService(IConfiguration config) {
        _autoHideThreshold = config.GetValue<int>(
            "Moderation:AutoHideThreshold",
            defaultValue: 3
        );
    }
}
```

```json
// appsettings.json
{
  "Moderation": { "AutoHideThreshold": 3 }
}
```

Cambiar el valor en producción: modificar env en Dokploy y reiniciar el container.

## Alternativas consideradas

### A. Hardcodeado como constante

```csharp
private const int AUTO_HIDE_THRESHOLD = 3;
```

Descartada: cambiar requiere code change + PR + deploy. Aceptable si el valor nunca se tuneara en la práctica, pero innecesariamente rígido cuando la alternativa env var tiene costo comparable.

### B. DB-stored en tabla `SystemConfig`

Tabla `SystemConfig(key, value, updated_at, updated_by)`, servicio que lee con cache en memoria, endpoint admin para escribir, invalidación de cache.

Descartada para MVP: montar la infraestructura lleva 3-4 horas. El único beneficio vs env var es evitar el restart del container al cambiar, lo cual en Dokploy es un click. Para un parámetro que se toca raramente, no justifica la complejidad.

Se revisita cuando aparezcan más parámetros runtime-tuneables (rate limits, expiraciones de token, umbrales varios). Ahí sí conviene consolidar en `SystemConfig` de una vez.

### C. Feature flag service (LaunchDarkly, Unleash)

Descartada: overkill para un entero. Suma dependencia externa pagada o otro servicio self-hosted.

## Consecuencias

**Positivas:**

- Cambiar el threshold es modificar env + restart del container. Minutos, no horas.
- Cero complejidad agregada al código (~3 líneas).
- El default vive en `appsettings.json`, visible en el repo.

**Negativas:**

- Cambiar el valor requiere container restart. En un deploy de alta disponibilidad esto obliga a rolling restart; en el MVP single-instance no es problema.
- Si más parámetros ameritan configurabilidad runtime, eventualmente hay que migrar a `SystemConfig` — no se reaprovecha la infraestructura de env vars.

**Cuándo revisitar:**

- Aparecen ≥3 parámetros similares que ameritan tuneo sin restart.
- El valor resulta cambiarse más de 2-3 veces al año (indicador de que el balance elegido es frágil).
