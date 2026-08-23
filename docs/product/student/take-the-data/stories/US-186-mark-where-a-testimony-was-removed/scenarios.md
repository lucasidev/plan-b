# US-186: Marcar el texto retirado

> Los casos de [US-186](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Nahuel bajó, con la categoría "Vida privada, salud o familia", el comentario que Matías había escrito al reseñar la Cátedra Pérez en el período 2023, segundo cuatrimestre
Cuando alguien entra a esa Ficha de cátedra
Entonces ve, en el lugar de ese testimonio, que el texto se retiró y con qué categoría, sin ninguna palabra del comentario original.

**E2.** Dado que Matías había marcado "Hay clases que no se dan" (F18) en esa misma reseña
Cuando su comentario se retira
Entonces F18 en la Cátedra Pérez sigue sumando la voz de Matías en su proporción, igual que antes del retiro.

## Negativos

**N1.** Dado que el comentario de Matías se retiró por hablar de una persona fuera de su acto público
Cuando alguien lee la Ficha de cátedra
Entonces no encuentra ningún resumen ni fragmento del contenido retirado, ni siquiera parafraseado: solo la marca de retirado y la categoría.

## Edge cases

- Con el tiempo se retiran todos los comentarios con texto de la Cátedra Gómez: la sección de testimonios queda sin nada para leer, pero las listas de frases por eje siguen mostrando sus voces con normalidad.
- Rocío descarga el CSV el lunes; Nahuel retira el comentario de Matías el martes; Rocío descarga de nuevo el miércoles: las dos descargas traen los mismos números de voces para F18, porque el CSV nunca tuvo ese texto y retirarlo no mueve ningún conteo.
