# Decision Records

Registro de decisiones del proyecto planb. No limitado a arquitectura: cubre patrones de diseño, convenciones, trade-offs, elecciones de herramientas, o cualquier decisión donde hubo alternativas reales y el "por qué" amerita quedar por escrito.

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

Archivos numerados secuencialmente: `NNNN-titulo-corto.md`.

**Una alternativa es una opción rival, no un complemento.** Si algo se puede hacer **además** de lo que se decide, no va en "Alternativas consideradas": ponerlo ahí lo condena, porque se lo descarta por comparación con la opción elegida cuando nunca estuvo compitiendo. Va en una sección aparte, del tipo "Lo que compone, no compite". Pasó en [ADR-0076](0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md): el rate limiting se escribió como *"en vez de"* la respuesta genérica, se descartó por eso, y volvió recién cuando un pase adversarial encontró el agujero que tapaba.

**El título y el filename van en inglés. El cuerpo va en español rioplatense.** Lo verifica `scripts/check-docs.ts` en cada push: un ADR nuevo cuyo título o filename lea como español sale como hallazgo. Los 60 que estaban en español se migraron el 2026-08-21, así que no hay excepciones ni número de corte.

Es el mismo corte que rige el resto del repo, aplicado a los artefactos: el título es un identificador de una línea, del lado de los nombres de rama y los identificadores del código; el cuerpo es prosa, del lado de los comentarios y los docstrings.

Decidido el 2026-07-30. Hasta ese día 42 de los 59 títulos estaban en español; migrarlos es un barrido aparte con sus 1697 referencias.

Cada ADR con:

```markdown
# NNNN: Título

- **Estado**: propuesto | aceptado
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

## Cuando una decisión cambia

**Esta carpeta contiene solo decisiones vigentes.** Cuando una decisión cambia, se escribe el ADR nuevo y el viejo **se borra en el mismo commit**, con todas sus referencias en el repo apuntadas al reemplazo o reescritas (decidido el 2026-08-25: los rebasados no se taguean, se van; un lector que abre la carpeta lee solo verdad).

Para que el borrado no pierda nada:

- **El ADR nuevo consolida todo lo que sigue vigente** del que reemplaza: lo vivo se absorbe, no se deja huérfano en un archivo muerto.
- **El camino recorrido entra como alternativas consideradas** del nuevo: las formas que se probaron y murieron son la mitad del valor del registro, contadas donde se las va a leer.
- **La numeración no se recicla**: los números de los borrados quedan huecos. El número es identificador, no índice; la arqueología, si alguna vez hace falta, está en git.

Distinguir dos cosas que se confunden:

- **Corrección**: el ADR dice algo que siempre estuvo mal (un status code mal transcripto, un nombre equivocado). Se arregla en el lugar, sin ADR nuevo.
- **Decisión nueva**: cambió lo que decidimos. ADR nuevo, y el viejo borrado con sus referencias corregidas.

## Referencias

Basado en [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records).
