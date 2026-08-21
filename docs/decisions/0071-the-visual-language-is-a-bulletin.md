# ADR-0071: The visual language is a bulletin: cool paper, serif data, one oxblood alarm

- **Estado**: aceptado
- **Fecha**: 2026-08-19

## Contexto

Las 34 pantallas tienen ficha y boceto mid-fi revisados; el paso siguiente es el hi-fi de las pantallas que definen el producto, y el hi-fi fija la identidad visual de verdad. El contrato vigente era la paleta Apricot Soft del rediseño anterior ([ADR-0041](0041-ux-redesign-after-claude-design.md)): crema cálido, terracota, Geist. Antes de dibujar, se puso la decisión sobre la mesa: ocho direcciones en dos rondas, cada una aplicada a la misma pantalla real (la cabecera de la Ficha de cátedra, con los números del canon) para comparar sistema y no contenido, con dos invariantes que ninguna podía tocar: la gestión alarma y la exigencia informa (ADR-0065), y todo número con sus voces y su encogimiento (ADR-0064).

## Decisión

**La dirección visual del producto es el boletín**: papel frío, la evidencia primero, un solo color de alarma.

1. **Paleta**: fondos de papel frío (`#f7f5ef` de página, `#eeece5` elevado, `#fffefb` de tarjeta), tinta casi negra (`#191b1f`, con `#494e57` y `#7b8089` de apoyo), bordes `#e2dfd6`. **Un solo acento, y es la alarma**: el rojo oxidado `#8d2418` (soft `#f5e4e0`), reservado para la gestión: alguien fallando. La exigencia y todo lo demás informan en tinta neutra. No hay segundo acento decorativo: lo que en Apricot era terracota-adorno acá no existe, y eso resuelve la competencia entre el acento y la alarma que la ronda 1 hizo visible.
2. **Tipografía**: **Newsreader** (serif) para títulos y números publicados: el dato con la voz del informe; **Geist** para el cuerpo y la UI (se conserva: el costo de adopción del frontend es cero en el cuerpo); **IBM Plex Mono** para etiquetas, eyebrows y metadatos. Newsreader itálica reemplaza a Instrument Serif en citas. En cuerpos chicos y en celular manda Geist: el serif no baja de los tamaños de título y número, que es donde rinde.
3. **Forma**: radios contenidos (4/6/10, píldora para chips), bordes de 1px, sombras mínimas. La jerarquía la hacen el tipo y el espacio, no la decoración.
4. **Los invariantes semánticos quedan en el contrato**: gestión = alarma (el oxidado), exigencia = información (tinta neutra); toda proporción publicada viaja con sus voces y su encogimiento. Cualquier pantalla que los rompa está mal aunque respete la paleta.

## Alternativas consideradas

Ocho direcciones sobre la misma pantalla, exploradas el 2026-08-19 (los artboards quedan en el canvas de exploración; no son fuente: la fuente es este ADR y el design system).

- **A. Apricot Soft (lo implementado)**: cálido, cero costo de adopción. Descartada: el terracota decorativo compite con el terracota-alarma, y el conjunto se lee más diario personal que instrumento.
- **C. Instrumento** (mono en todo número, panel de medición): honesto con la tesis pero frío para quien viene a contar; el azul institucional traía un segundo acento a domar. Descartada.
- **D. Cartel** (negro, amarillo, números enormes): la presión visible, pero el volumen visual se lee como juicio y tensiona el "no juzga lo que mide". Descartada.
- **E. Pizarrón** (oscura): dark-only invierte el trabajo de contraste y castiga capturas e impresión. Descartada.
- **F. Cuaderno** (hoja rayada, resaltador): el mundo material del alumno, pero infantiliza el dato. Descartada.
- **G. Expediente** (manila, máquina de escribir, sello): habla de prueba, pero el retro es disfraz y no escala a fichas densas. Descartada.
- **H. Bloques** (neo-brutal): moda con fecha de vencimiento; las sombras duras ensucian fichas con muchas tarjetas. Descartada.

**B. Boletín** gana porque es la dirección que le habla a la persona que decide el destino del dato: Rocío lo cita, Silvia lo lee sin vocabulario, la mesa de discusión lo toma en serio. El costo asumido: es más distante para Lucía que un cálido; se compensa manteniendo Geist en el cuerpo y el tono rioplatense del copy, que es donde vive la calidez de este producto.

## Consecuencias

- **[`docs/product/design-system.md`](../product/design-system.md) se reescribe** con esta paleta, tipografía y forma como contrato, en el mismo commit.
- **El hi-fi de las pantallas clave aplica este contrato** (en el `sketch.html` de cada una, como fija [ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md): git guarda el mid-fi).
- **Los bocetos mid-fi existentes no se repintan**: son estructura, no contrato visual (sus fichas ya lo dicen), y quedaron con Apricot. Repintar 40 bocetos es ceremonia; el contrato lo marca este ADR.
- **`frontend/src/app/globals.css` no se toca todavía**: sigue Apricot sirviendo al chasis en retiro. Los tokens nuevos aterrizan con el primer slice del producto nuevo (o un PR de tokens propio si conviene antes), y el design system documenta la transición para que el drift sea explícito y no accidente.
- **Instrument Serif sale del contrato** (la reemplaza Newsreader itálica); Geist y Plex Mono se conservan.
- [ADR-0041](0041-ux-redesign-after-claude-design.md) queda **parcialmente superado**: su proceso y su decisión de tokens-en-globals siguen; su paleta Apricot Soft deja de ser el contrato.

## Refs

- [ADR-0064](0064-phrases-with-voices-not-scores.md), [ADR-0065](0065-attribution-is-the-axis-not-a-split.md) (los invariantes que el contrato visual carga). [ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md) (dónde vive el hi-fi). [ADR-0041](0041-ux-redesign-after-claude-design.md) (el contrato anterior).
- Personas: Rocío y Silvia ([user-personas](../product/personas.md)), las que esta dirección prioriza; Lucía, cuyo costo se asume y se compensa en el copy.
