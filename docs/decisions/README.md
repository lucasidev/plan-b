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

- **Estado**: propuesto | aceptado | aceptado, extendido por NNNN | rechazado | superado por NNNN | parcialmente superado por NNNN (qué parte) | deprecado por NNNN
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

**Una decisión nueva va en un ADR nuevo, nunca como sección adentro del viejo.** El viejo se taguea en su `Estado` apuntando al nuevo.

La razón es que un ADR que sigue diciendo `aceptado` mientras el código hace otra cosa es documentación que miente, y el lector no tiene cómo enterarse: llega al doc, lee la decisión, y no hay nada que le avise. Esconder el cambio adentro de una sección al final del archivo es la misma mentira con más pasos, porque el `Estado` de arriba es lo primero que se lee.

**Y se taguea en el mismo commit que crea el nuevo.** No es un paso posterior: si el ADR nuevo supersede, depreca o extiende a otros, esos otros cambian su `Estado` en el mismo diff, con el link. Es lo que hace que la cadena de ADRs sea la verdad completa, y no solo el último. Es el paso que más fácil se saltea, porque el ADR nuevo se escribe con la cabeza en la decisión y los viejos quedan diciendo `aceptado`.

Los estados, para no inventar uno cada vez: `aceptado` (vigente), `superado por NNNN` (hay decisión que lo reemplaza; si es una parte, `parcialmente superado por NNNN (qué parte)`), `deprecado por NNNN` (murió sin reemplazo directo, típicamente porque el producto que lo necesitaba se retiró), y `aceptado, extendido por NNNN` (sigue vigente y otro ADR lo amplía o lo revalida). Es la escalera estándar de los ADRs (propuesto → aceptado → superado / deprecado, con extensiones), y el cuerpo del ADR viejo no se edita en ninguno de los casos: es historia.

Distinguir dos cosas que se confunden:

- **Corrección**: el ADR dice algo que siempre estuvo mal (un status code mal transcripto, un nombre equivocado). Se arregla en el lugar, sin ADR nuevo.
- **Decisión nueva**: cambió lo que decidimos. ADR nuevo, y el viejo tagueado.

Dos detalles que importan:

- **Si el título del ADR viejo dejó de ser cierto, se corrige el título.** El filename se conserva, porque los links del repo apuntan a él, y se agrega una línea `- **Nota**` explicando por qué el slug quedó viejo. Un título que miente es peor que un `Estado` que miente: se lee en el índice, en los links y en las referencias cruzadas.
- **En la supersesión parcial, decir qué parte.** "Parcialmente superado por NNNN" sin decir cuál parte obliga a leer los dos ADRs enteros para saber qué sigue vigente.

## Referencias

Basado en [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records).
