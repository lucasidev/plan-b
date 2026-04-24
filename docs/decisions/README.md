# Decision Records

Registro de decisiones del proyecto planb. No limitado a arquitectura — cubre patrones de diseño, convenciones, trade-offs, elecciones de herramientas, o cualquier decisión donde hubo alternativas reales y el "por qué" amerita quedar por escrito.

## Cuándo escribir un registro

Tres preguntas. Si las tres son "sí", escribilo. Si alguna es "no", no amerita.

1. **¿Había alternativas reales que descartaste por razones concretas?**
   Las alternativas rechazadas son la mitad del valor del registro.

2. **¿Si alguien hace lo contrario dentro de 3 meses, se rompe algo o desalinea al proyecto?**
   Si no hay constraint futuro, es preferencia, no decisión.

3. **¿El "por qué" se va a olvidar?**
   Si se deriva del código o el contexto es obvio, no escribas.

## Qué NO va acá

- Facts derivables del código (shape, dependencias, stack) → el código mismo o el README del proyecto.
- Preferencias personales de desarrollo → fuera del repo.
- Cambios operativos (versiones, migraciones aplicadas) → `CHANGELOG.md`.
- Tweaks de config sin alternativa considerada → solo commit.

## Formato

Archivos numerados secuencialmente: `NNNN-titulo-corto.md`. Cada uno con:

```markdown
# NNNN: Título

- **Estado**: propuesto | aceptado | rechazado | superado por NNNN
- **Fecha**: YYYY-MM-DD

## Contexto
El problema y las fuerzas en juego.

## Decisión
Qué se decidió.

## Alternativas consideradas
Qué se evaluó y por qué se descartó.

## Consecuencias
Positivas, negativas, advertencias.
```

## Referencias

Basado en [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records).
