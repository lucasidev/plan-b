# Recuperar (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html), corto: pedir el link, el mail, la contraseña nueva; revisión adversarial pendiente antes del hi-fi. Pública: se llega y se usa sin cuenta, para volver a la que ya tenías. Slug hoy `/forgot-password` (del inventario). Épicas que la componen: [Que no me molesten](../../../epics/do-not-bother-me/README.md) (la garantía que antes tenía un ID propio, O5-3: la cuenta con todo adentro vuelve con un link al mail).

## Quién la usa

Cualquier cuenta que olvidó su contraseña y quiere volver a lo que ya tiene adentro: sus reseñas, sus votos, lo pendiente de vincular. **Matías**, **Lucía**, **Diego**, **Claudia**.

## Qué stories resuelve

No tiene una story con ID propio en el catálogo vigente: es la garantía que describe el texto de [Que no me molesten](../../../epics/do-not-bother-me/README.md) (antes numerada O5-3; hoy no tiene fila en ninguna tabla de stories): "recuperar la contraseña, con la cuenta y todo lo que tiene adentro, vuelve con un link al mail". Comparte el espíritu de [O6-2](../../../epics/do-not-bother-me/README.md#stories): nada de lo declarado se pierde ni se vuelve a preguntar.

## Qué muestra, paso por paso

1. **Pedir el link**: un campo de mail y un botón. Al mandarlo, la pantalla confirma que el link salió, sin más datos.
2. **Desde el link, la contraseña nueva**: un campo para la contraseña y uno para repetirla, con un botón para guardar. Nada más se pregunta: ni situación, ni institución, ni carrera.

**Estado "mail enviado"**: la confirmación de que el link salió, con la opción de pedirlo de nuevo si no llega. **Estado "link vencido"**: el link ya no sirve, con un botón para pedir uno nuevo; la cuenta y lo que tiene adentro siguen intactas, porque lo que vence es el link, nunca la cuenta.

## Lo que no muestra nunca

Ninguna pregunta ya declarada (situación, institución, carrera); ningún aviso de que algo se perdió: la garantía es que todo vuelve exactamente igual, con las reseñas, los votos y lo pendiente donde estaban.

## Adónde va

Llega desde Ingresar ("¿olvidaste tu contraseña?"). Al guardar la contraseña nueva, vuelve a Ingresar, desde donde el gate de la acción original (si había una) retoma como en cualquier ingreso.

## Decisiones que aplica

[Que no me molesten](../../../epics/do-not-bother-me/README.md) (la garantía, dicha en su propio texto), [THESIS.md](../../../THESIS.md) (decisión 3: producir pide cuenta, y esta pantalla sostiene esa cuenta sin fricción).

## Lo que esta ficha deja abierto

- **Cuánto dura el link** antes de vencer.
- **Si pedir el link muchas veces seguidas tiene algún límite**: ninguna fuente lo fija.
