# Reseñar (la pantalla)

> Ficha de pantalla, dueña: la épica [Reseñar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de los seis pasos y sus estados; revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta: el gate está en la acción (Ingresar / Registro con el motivo a la vista y vuelta), no en la lectura. Slug hoy `/reviews/write` (existe el editor texto-libre de la versión anterior; el acto de frases es otro modelo y el chasis se rehace).

## Quién la usa

**Lucía** (veinte horas de trabajo: cinco minutos o no lo hace), **Matías** (llega desde una ficha que acaba de leer y quiere que quede registrado), **Diego** (dejó la carrera: reseña la materia por la que se fue y contesta cuándo se fue). El flujo entero, con sus ramas: [`flow.md`](../../flow.md).

## Qué stories resuelve

Las de la épica, todas: O4-1 (menos de cinco minutos, marcando), O4-2 (una materia sola), O4-4 (qué se publica y qué no), O4-6 (clases sin dar), O4-7 y O4-9 (quien dejó reseña igual y suma igual), O4-8 (el año en que me fui, por el camino de "período viejo"), O4-10 (cómo terminó), O4-11 (cuándo entré, una vez), O4-13 (el evento institucional, como rama), T2-1 (el chequeo previo), T2-4 (el aviso de la sospecha), T3-1 (la materia que no está), T3-3 (retomar), T3-4 (qué sumó, al terminar), T3-5 (la recursada), T4-1 (marcar el sentido contrario). O4-5 y O4-12 son los mails que traen hasta acá ([Avisos](../../../notices/README.md)). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra, paso por paso

Seis pasos con una barra de progreso; todo lo ya contestado se guarda solo (T3-3). Los datos que siguen son los del boceto.

1. **¿Qué materia cursaste?** Buscar en tu plan o escribirla; las ya reseñadas se ven con su período (una segunda reseña se acepta si el período es otro, T3-5). Debajo, la salida "fue un trámite, el título, una mesa: un evento, no una materia" (O4-13: pregunta cuándo pasó el evento, ADR-0067; sin cátedra; las frases del sujeto institución, directo al comentario). **Estado "no está en el plan"**: se acepta igual, queda pendiente de vincular, no cuenta en ninguna ficha hasta entonces y se ve pendiente en Mis aportes (T3-1, D08).
2. **¿Cuándo la cursaste?** El período (chips de los últimos períodos y "otro"). La primera vez que la cuenta reseña esta carrera, la misma pantalla pregunta **el año de ingreso**, una sola vez, con "prefiero no decirlo" (O4-11; el silencio queda como "no dijo"). **Estado "período viejo"**: si el período es viejo y la cuenta no dijo su situación, aparece la pregunta de [Mi situación](../my-status/README.md) (sigo / me recibí, en… / me fui, en… / ahora no): una sola vez, nunca se infiere (O4-8, ADR-0067).
3. **¿Cómo terminó?** Un toque: la aprobé, me quedó regular, la desaprobé, la dejé, sigo cursando (O4-10). La pantalla dice que esto no se publica con la reseña (O4-4).
4. **¿Qué te pasó con la materia?** Las frases de materia del [catálogo](../../../../domain/phrases.md) (F01 a F11), exigencia neutra y gestión con el color de alarma, cada una con su sujeto y su eje (ADR-0065); se marcan las que te pasaron, y donde hay dos sentidos se marca el que describe tu caso (T4-1). Cuántas se ofrecen por vez sigue abierto.
5. **¿Con qué cátedra la cursaste?** Opcional: la lista de cátedras de la materia, o "no me acuerdo / no aparece"; elegir esto último no ofrece las frases de cátedra ni la pregunta de clases sin dar, y tus frases de materia cuentan igual. Si la recordás, sus frases (F12 a F29) van a su ficha; el trato y el acoso entran como cualquier otra frase. Si marcaste "Hay clases que no se dan", aparece **¿cuántas, más o menos?** en rangos; lo que se publica es la mediana y el rango con sus voces, nunca tu número solo (O4-6, D02). Después, opcional, **¿Y alrededor de la cursada?**: frases de administración e institución (trámites, mesas, el sistema); van a la ficha de la institución, porque un trámite que falla mientras cursás es alguien fallando en tu carrera (ADR-0064, ADR-0066).
6. **¿Algo que ninguna frase dijo?** El comentario, opcional, con tope (600 caracteres en el boceto) y la advertencia "se lee; no suma a los conteos". El **chequeo previo** (T2-1, ADR-0068): lo que identifica por contexto se resalta y decidís vos (dejarlo o sacarlo, sabiendo que la réplica no podrá citarlo); lo que habla de una persona fuera de su acto queda retenido hasta que alguien lo mire, y se te dice. El **aviso de la sospecha** (T2-4) con las palabras de la tesis: no publicamos quién; en una comisión chica pueden sospechar. Dos salidas: **Publicar reseña** o **Publicar sin comentario**.

**Al terminar**: "Quedó registrada", qué frases sumaron tu voz y cuánto (T3-4), y tres salidas: la ficha de la cátedra, reseñar otra materia, Mis aportes. **Estado "quedó a medias"**: se guardó sola; retomar o descartar (T3-3).

## Lo que no muestra nunca

El nombre, la cuenta, el rol ni cómo terminó (O4-4); ningún puntaje ni escala (ADR-0064); ninguna pregunta que la cuenta ya contestó (O6-2); ningún paso obligatorio que no sea elegir la materia, el período, cómo terminó y al menos una frase (O4-1: se publica marcando, sin escribir nada).

## Adónde va

A la ficha de la cátedra o de la materia ([Ficha de cátedra](../../../../design/screens/chair/README.md)) para ver lo que sumó; a Mis aportes ([Deshacer](../../../undo/README.md) la edita o la borra; el comentario editado vuelve al chequeo); a reseñar otra. Llega desde los mails de [Avisos](../../../notices/README.md), desde cualquier ficha (el gate en la acción) y desde Mi carrera.

## Decisiones que aplica

[ADR-0064](../../../../decisions/0064-phrases-with-voices-not-scores.md), [ADR-0065](../../../../decisions/0065-attribution-is-the-axis-not-a-split.md), [ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md), [ADR-0068](../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md), [ADR-0069](../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md), D02 y D08 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md)). Las cuatro garantías de [Que no me molesten](../../../do-not-bother-me/README.md) se verifican acá: no pide cuenta para leer (no aplica: es producir), no repregunta, funciona sin plan marcado, no destaca nada.

## Lo que esta ficha deja abierto

- **Cuántas frases se ofrecen por vez y en qué orden** (el boceto muestra las once de materia y las dieciocho de cátedra enteras; con el catálogo creciendo eso no escala).
- **El tope exacto del comentario** (600 en el boceto; ADR-0068 dice "un párrafo").
- **Cuánto tiempo se guarda lo que quedó a medias** (T3-3).
- **Si la pantalla avisa que existe el sentido contrario** de la frase que estás por marcar, o alcanza con que estén las dos a la vista (T4-1).
- **El evento institucional**: el boceto lo deja como salida del paso 1; si es una pantalla propia o este mismo recorrido con otras frases se decide al dibujarlo.
- **Si una cursada sin cátedra recordada pierde las frases de cátedra o hace falta una «cátedra sin identificar»** (la G2 del registro del 16 quedó superada): hoy el boceto ofrece solo las de materia.
