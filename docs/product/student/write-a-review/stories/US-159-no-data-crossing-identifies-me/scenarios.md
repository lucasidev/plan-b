# US-159: Que ningún cruce me identifique

> Los casos de [US-159](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la cátedra Gómez (Estadística, turno tarde, período 2026-C1) tiene 9 reseñas.
Cuando Rocío visita su ficha pública o descarga su CSV agregado.
Entonces no encuentra ningún dato publicado de esa cátedra (ni conteos, ni distribución, ni voces): la ficha solo muestra el estado del piso ("junta 9 reseñas: con 1 más se publica").

**E2.** Dado que la cátedra Gómez llega a su décima reseña, con Lucía entre las 10 personas que cursaron.
Cuando se visita su ficha pública o se descarga el CSV agregado.
Entonces se publican los conteos por ítem (moda, distribución, voces), pero ninguna columna ni campo trae un nombre, una cuenta ni un identificador de perfil.

**E3.** Dado que Lucía, una de esas 10 personas, está en el paso 6 de Reseñar esa misma cátedra, antes de enviar.
Cuando llega al contrato previo a enviar.
Entonces ve el texto que dice que sus respuestas se suman al total, que ninguna reseña individual se muestra jamás, y el estado del piso de esa cátedra.

## Negativos

**N1.** Dado que la cátedra Gómez tiene solo 9 voces (por debajo del piso), Cuando el sistema arma su ficha pública o el CSV, Entonces no publica ningún conteo de esa cátedra, ni siquiera agregado: el piso bloquea toda publicación hasta la décima reseña.

## Edge cases

- No existe una versión del dato que se publique "igual, pero con menos precisión" por debajo del piso: se publica desde las 10 reseñas, o no se publica en absoluto.
- Falta decidir: si hace falta algún aviso adicional para cátedras que quedan justo arriba del piso (11, 12 reseñas); hoy la única señal es el estado del piso mostrado en el paso 6.
