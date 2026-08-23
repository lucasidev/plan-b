# US-202: Cargar con una fuente no oficial

> Los casos de [US-202](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la facultad de "Ingeniería en Sistemas de Información" (UTN) no publica el reglamento de correlatividades completo.
Cuando Sofía carga "Análisis Matemático II pide Álgebra para cursar" y marca el campo como "fuente: no oficial", con la aclaración "reconstruida a partir del reglamento de correlatividades 2022; la facultad no publica el plan vigente completo".
Entonces el campo se guarda igual: la falta de fuente oficial no bloquea la carga.

**E2.** Dado ese mismo campo cargado como "fuente: no oficial" y la oferta ya publicada.
Cuando alguien lee la ficha pública de "Ingeniería en Sistemas de Información" (UTN).
Entonces esa correlativa se muestra con la marca de que no viene de una fuente oficial.

## Negativos

**N1.** Dado un campo con fuente oficial confirmada, como la duración nominal de "Ingeniería en Sistemas" (UNSTA), cargada con fuente "plan de estudios 2024, publicado por la facultad". Cuando alguien lee esa ficha pública. Entonces ese campo NO muestra la marca de "fuente: no oficial": la marca solo aparece en los campos que efectivamente se cargaron sin fuente oficial.

## Edge cases

- Un campo marcado "fuente: no oficial" que llega después a Correcciones: la pantalla dice que no hay fuente oficial con la que contrastar, en vez de exigir una que no existe (US-202 aplicado dentro de US-194).
- La facultad publica, más adelante, la fuente oficial que faltaba: si el campo se "oficializa" solo o alguien tiene que recargarlo a mano no está definido (Falta decidir).
- Dos fuentes no oficiales que se contradicen entre sí, por ejemplo dos versiones de un reglamento que no coinciden: con cuál se queda el catálogo no está definido (Falta decidir).
