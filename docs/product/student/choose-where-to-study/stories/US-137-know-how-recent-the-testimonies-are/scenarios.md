# US-137: Saber de cuándo son los testimonios

> Los casos de [US-137](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Cátedra Pérez tiene voces desde 2022 hasta 2025, y hoy es 2026
Cuando se mira su Ficha de cátedra
Entonces la línea de sustento dice "41 voces, de 2022 a 2025", sin ningún aviso, porque de 2025 a 2026 pasó menos de dos años.

**E2.** Dado que Cátedra Gómez (la otra cátedra de Análisis Matemático II en UNSTA) tiene su última voz en 2023, y hoy es 2026
Cuando se mira su Ficha de cátedra
Entonces aparece el aviso de que lo último es de hace más de dos años, junto al período que la sostiene.

## Negativos

**N1.** Dado el mismo caso de Cátedra Gómez
Cuando se muestra el aviso
Entonces no dice ni implica que los datos sean falsos ni que no haya que confiar en ellos: solo declara la antigüedad, sin retirar ni ocultar ninguna frase publicada.

## Edge cases

- Una ficha con una sola voz, de hace tres años: el aviso aparece igual que si hubiera cientos de voces viejas, porque depende de la fecha, no de la cantidad.
- La Ficha de materia Análisis Matemático II suma cursadas de Cátedra Pérez (hasta 2025) y Cátedra Gómez (hasta 2023): el período que se muestra en la materia es el más reciente de las dos (2025), y el aviso se evalúa contra ese máximo, no contra cada cátedra por separado.
- Si "más de dos años" es el umbral correcto para toda ficha o depende del sujeto (una cátedra cambia de docente más rápido que una carrera cambia de plan): la propia épica lo deja abierto. **Falta decidir**.
