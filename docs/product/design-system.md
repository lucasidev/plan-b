# Design system

Documento canónico del lenguaje visual de plan-b: paleta, tipografía, forma y su mapping al frontend. **El contrato es la dirección Boletín** ([ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19): papel frío, la evidencia primero, un solo color de alarma.

`frontend/src/app/globals.css` sirve estos tokens en `@theme`, sin scope: valen en toda la aplicación. Los bocetos mid-fi anteriores al ADR quedaron con la paleta anterior (son estructura, no contrato).

## Los dos invariantes que la paleta carga

1. **El rojo es solo la opción negativa publicada** ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)): en una distribución, el segmento de la opción negativa; en un badge de moda, solo cuando la moda ES la opción negativa. Nada más se pinta: no hay semáforos, no hay umbrales editoriales, y la recolección (Reseñar) va sin rojo: la alarma es lectura, no captura.
2. **Todo conteo publicado viaja con sus voces** ([ADR-0083](../decisions/0083-the-ficha-publishes-counts-not-scores.md)): el estilo nunca muestra un número pelado, y la síntesis de una frase es su moda literal con la distribución al lado, jamás un promedio.

## Paleta

| Token (contrato) | Valor | Rol |
|---|---|---|
| `--color-bg` | `#f7f5ef` | Fondo de página: papel frío. |
| `--color-bg-elev` | `#eeece5` | Fondo elevado / paneles neutros. |
| `--color-bg-card` | `#fffefb` | Tarjeta. |
| `--color-ink` | `#191b1f` | Texto principal. |
| `--color-ink-2` | `#494e57` | Texto secundario. |
| `--color-ink-3` | `#62676f` | Labels, eyebrows, metadatos. |
| `--color-ink-4` | `#a7adb5` | Disabled / placeholder. |
| `--color-line` | `#e2dfd6` | Borde primario (1px). |
| `--color-line-2` | `#eae7de` | Divisor sutil. |
| `--color-alarm` | `#8d2418` | **La alarma**: gestión, alguien fallando. Único acento. |
| `--color-alarm-soft` | `#f5e4e0` | Fondo suave de la alarma. |
| `--color-alarm-ink` | `#6e1c12` | Alarma como texto sobre soft. |
| `--color-alarm-hover` | `#741d10` | Hover de acciones alarma. |

`--color-ink-3` es el tono más claro con el que se escribe texto: llega a 4,5:1 (WCAG AA) sobre los tres fondos (`--color-bg`, `--color-bg-card`, `--color-bg-elev`). `--color-ink-4` no es para texto legible: solo deshabilitado, placeholder y relleno no textual de barras.

Los estados del dominio (`--color-st-*`: aprobada, regular, cursando, desaprobada, pendiente) conservan su taxonomía y sus valores actuales de `globals.css`, todavía sin rearmonizar contra el papel frío (pendiente: misma lightness/chroma en oklch, hues como están).

## Tipografía

| Rol | Familia | Dónde | Regla |
|---|---|---|---|
| Títulos y números publicados | **Newsreader** (serif) | H1-H3 de fichas, las proporciones de cabecera, los números grandes | El dato con la voz del informe. Nunca por debajo de ~18px. |
| Cuerpo y UI | **Geist** | Todo lo demás: párrafos, botones, forms, listas | En celular y cuerpos chicos manda Geist, siempre. |
| Etiquetas y metadatos | **IBM Plex Mono** | Eyebrows, "34 de 42 voces · 2023 a 2026", períodos, fuentes de datos oficiales, chips de sistema | Uppercase con tracking solo en eyebrows. |
| Citas (notas de curaduría) | Newsreader itálica | La nota editorial entre comillas, con su procedencia en mono | Reemplaza a Instrument Serif. |

## Forma

- **Radios**: 4px (chico), 6px (base), 10px (tarjetas grandes), 999px (chips y píldoras).
- **Bordes**: 1px `--color-line`; la alarma bordea con `#e6c3bc`.
- **Sombras**: mínimas (`0 1px 2px rgb(25 27 31 / 6%)` en tarjetas, y solo si el fondo no alcanza). La jerarquía la hacen el tipo y el espacio, no la elevación.
- **Barras de distribución**: alto 6-8px, segmentos por opción separados por 1px; la opción negativa en alarma, las intermedias en `--color-ink-3`/`--color-ink-4`, la positiva en el gris más claro. El ancho de cada segmento es su conteo crudo (suman 100 entre quienes respondieron).

## Mapping al frontend

Tailwind 4 exige el prefijo `--color-` para generar utilities (`bg-bg`, `text-ink`): los nombres de arriba ya lo llevan, y son los que están en `@theme`. Dos cosas quedan pendientes, ninguna cosmética: retirar `--color-accent*` (sigue viva, Apricot, porque algunos componentes todavía la consumen como acento decorativo, algo que el contrato Boletín no tiene) y sumar Newsreader vía `next/font` como `--font-display` (hoy sigue en Geist).

## Fuentes en el repo

| Capa | Archivo | Qué es |
|---|---|---|
| Contrato | Este doc + [ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md) | La decisión, con las ocho alternativas exploradas. |
| Hi-fi | `docs/product/<slice>/screens/<screen>/sketch.html` de las pantallas clave | Aplican este contrato (el mid-fi queda en git). |
| Mid-fi | el resto de `docs/product/*/screens/` | Estructura y estados; paleta anterior, a propósito. |
| Implementación | [`frontend/src/app/globals.css`](../../frontend/src/app/globals.css) | Estos tokens, en `@theme`, sin scope. |

## Cómo se mantiene

- Cambios de contrato visual: por ADR (como el 0071), y este doc en el mismo diff.
- `globals.css` es la fuente de los valores y este doc espeja, como siempre fue con Apricot.
- Si un hi-fi necesita un token que no está acá, primero se agrega acá (con su rol dicho), después se usa.
