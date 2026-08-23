# US-159: Que ningún cruce me identifique

> Los casos de [US-159](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Rocío descarga el CSV agregado de la cátedra Gómez (Estadística, turno tarde, período 2026-C1: 5 personas cursaron, 2 marcaron la frase F16, "Te la estudiás solo").
Cuando revisa cualquier columna del archivo: frases con sus voces, clases sin dar si las hay, hechos de trayectoria.
Entonces no encuentra en ninguna columna un nombre, una cuenta ni un identificador de perfil: todo viene agregado por frase, eje y período.

**E2.** Dado que Lucía, una de esas 5 personas, está en el paso 6 de Reseñar esa misma cátedra, a punto de publicar.
Cuando llega al aviso previo a publicar.
Entonces ve el texto que dice que no se promete anonimato estadístico, que en un grupo chico pueden sospechar, y que lo que se promete es no publicar quién.

## Negativos

**N1.** Dado que la cátedra Gómez tiene solo 5 voces en total (grupo chico), Cuando el sistema arma su ficha pública o el CSV, Entonces no aplica ningún piso mínimo que oculte o bloquee esos datos por ser pocas personas: se publican igual, con el encogimiento de Wilson a la vista.

## Edge cases

- Con una sola voz publicada (1 de 1 = 20,7%, límite inferior de Wilson con z = 1.96), el dato sale igual, sin piso ni bloqueo.
- Falta decidir: el copy exacto del aviso de la sospecha; acá se usan las palabras de la tesis, no el texto final de la pantalla.
