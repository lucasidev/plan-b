# US-220: Recuperar la contraseña con un link al mail

**Épica**: [Entrar](../README.md)
**Del mapa**: O5-3

## Historia

Como quien olvidó su contraseña, quiero volver a entrar con un link al mail, porque adentro está todo lo que aporté y no lo quiero perder.

## Listo cuando

- Se pide el link con el mail y la pantalla confirma que salió, sin decir nada más de la cuenta.
- El link lleva a poner la contraseña nueva, y no se pregunta nada más: ni situación, ni institución, ni carrera.
- Si el link vence se pide otro: lo que vence es el link, nunca la cuenta ni lo que tiene adentro.

## Dónde se resuelve

- [Recuperar](../screens/SC-024-forgot-password/README.md): los dos pasos (pedir el link, poner la contraseña nueva) y sus dos estados.
- [Ingresar](../screens/SC-025-sign-in/README.md): desde donde se llega cuando la contraseña no entra.

## Notas

Era la story `O5-3` de Deshacer. Al armar el catálogo del producto nuevo se absorbió como una frase adentro de las garantías de [Que no me molesten](../../do-not-bother-me/README.md), y eso dejó a Recuperar como la única pantalla del producto que ninguna story pedía. Vuelve como story porque **no es una garantía transversal**: esas se verifican en las 34 pantallas y no se construyen, y esto es una acción concreta, con su pantalla y su criterio. Es también la primera story propia de Entrar, que hasta acá solo cumplía las de otras épicas.
