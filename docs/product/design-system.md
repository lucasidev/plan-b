# Design system

Documento canónico del lenguaje visual de plan-b: paleta, tipografía, forma y su mapping al frontend. **El contrato es la dirección Boletín** ([ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19): papel frío, la evidencia primero, un solo color de alarma.

> **Transición, explícita**: `frontend/src/app/globals.css` todavía sirve la paleta anterior (Apricot Soft, [ADR-0041](../decisions/0041-ux-redesign-after-claude-design.md)) al chasis en retiro, y los bocetos mid-fi anteriores al ADR quedaron con ella (son estructura, no contrato). Los tokens de este doc aterrizan en `globals.css` con el primer slice del producto nuevo; el hi-fi de las pantallas clave ya los aplica.

## Los dos invariantes que la paleta carga

1. **Gestión = alarma, exigencia = información** ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)): el rojo oxidado es SOLO para "alguien fallando". La exigencia y todo lo demás van en tinta neutra. No hay acento decorativo: si algo está en rojo, está alarmando.
2. **Toda proporción publicada viaja con sus voces y su encogimiento** ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md)): el estilo nunca muestra un número pelado.

## Paleta

| Token (contrato) | Valor | Rol |
|---|---|---|
| `--color-bg` | `#f7f5ef` | Fondo de página: papel frío. |
| `--color-bg-elev` | `#eeece5` | Fondo elevado / paneles neutros. |
| `--color-bg-card` | `#fffefb` | Tarjeta. |
| `--color-ink` | `#191b1f` | Texto principal. |
| `--color-ink-2` | `#494e57` | Texto secundario. |
| `--color-ink-3` | `#7b8089` | Labels, eyebrows, metadatos. |
| `--color-ink-4` | `#a7adb5` | Disabled / placeholder. |
| `--color-line` | `#e2dfd6` | Borde primario (1px). |
| `--color-line-2` | `#eae7de` | Divisor sutil. |
| `--color-alarm` | `#8d2418` | **La alarma**: gestión, alguien fallando. Único acento. |
| `--color-alarm-soft` | `#f5e4e0` | Fondo suave de la alarma. |
| `--color-alarm-ink` | `#6e1c12` | Alarma como texto sobre soft. |
| `--color-alarm-hover` | `#741d10` | Hover de acciones alarma. |

Los estados del dominio (`--color-st-*`: aprobada, regular, cursando, desaprobada, pendiente) conservan su taxonomía actual de `globals.css`; se rearmonizan contra el papel frío cuando aterricen los tokens (misma lightness/chroma en oklch, hues como están).

## Tipografía

| Rol | Familia | Dónde | Regla |
|---|---|---|---|
| Títulos y números publicados | **Newsreader** (serif) | H1-H3 de fichas, las proporciones de cabecera, los números grandes | El dato con la voz del informe. Nunca por debajo de ~18px. |
| Cuerpo y UI | **Geist** | Todo lo demás: párrafos, botones, forms, listas | En celular y cuerpos chicos manda Geist, siempre. |
| Etiquetas y metadatos | **IBM Plex Mono** | Eyebrows, "k de N voces · encogido X%", períodos, chips de sistema | Uppercase con tracking solo en eyebrows. |
| Citas (testimonios) | Newsreader itálica | El comentario entre comillas | Reemplaza a Instrument Serif. |

## Forma

- **Radios**: 4px (chico), 6px (base), 10px (tarjetas grandes), 999px (chips y píldoras).
- **Bordes**: 1px `--color-line`; la alarma bordea con `#e6c3bc`.
- **Sombras**: mínimas (`0 1px 2px rgb(25 27 31 / 6%)` en tarjetas, y solo si el fondo no alcanza). La jerarquía la hacen el tipo y el espacio, no la elevación.
- **Barras de proporción**: alto 6-8px, track `--color-bg-elev`, fill alarma (gestión) o `--color-ink-3` (exigencia); el ancho es el encogido, nunca el crudo.

## Mapping al frontend (cuando aterrice)

Tailwind 4 exige el prefijo `--color-` para generar utilities (`bg-bg`, `text-ink`): los nombres de arriba ya lo llevan. El aterrizaje en `globals.css` renombra `--color-accent*` a `--color-alarm*` (el cambio no es cosmético: el token dice qué significa el color) y suma Newsreader vía `next/font` como `--font-display`, con Geist quedándose en `--font-ui`. Hasta ese PR, el mapping vigente es el de Apricot documentado en el historial de este archivo y en `globals.css`.

## Fuentes en el repo

| Capa | Archivo | Qué es |
|---|---|---|
| Contrato | Este doc + [ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md) | La decisión, con las ocho alternativas exploradas. |
| Hi-fi | `docs/product/<slice>/screens/<screen>/sketch.html` de las pantallas clave | Aplican este contrato (el mid-fi queda en git). |
| Mid-fi | el resto de `docs/product/*/screens/` | Estructura y estados; paleta anterior, a propósito. |
| Implementación | [`frontend/src/app/globals.css`](../../frontend/src/app/globals.css) | Hoy Apricot (chasis en retiro); recibe estos tokens con el primer slice nuevo. |

## Cómo se mantiene

- Cambios de contrato visual: por ADR (como el 0071), y este doc en el mismo diff.
- Cuando los tokens aterricen: `globals.css` pasa a ser la fuente de los valores y este doc espeja, como siempre fue con Apricot.
- Si un hi-fi necesita un token que no está acá, primero se agrega acá (con su rol dicho), después se usa.
