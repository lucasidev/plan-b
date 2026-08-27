# US-181: Cuánto se bajó del corpus

> **Concepto rebasado el 2026-08-25**: ver la nota en [README.md](README.md). Estos escenarios describen el modelo anterior (testimonio publicado y retirado) y quedan como registro histórico hasta que se decida el reemplazo.

> Los casos de [US-181](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que este trimestre Nahuel bajó 21 textos de 3.240 comentarios: 14 por la categoría "Vida privada, salud o familia", 4 por "Aspecto" y 3 por "Datos de contacto"
Cuando Rocío entra a Método
Entonces ve el conteo por categoría (14, 4, 3) y el total (21 de 3.240), sin ninguna palabra del contenido de los textos retirados.

**E2.** Dado que Matías reseñó la Cátedra Pérez marcando "Hay clases que no se dan" (F18) y escribió un comentario que Nahuel bajó por "Vida privada, salud o familia"
Cuando alguien entra a la Ficha de cátedra y mira la proporción de F18
Entonces la voz de Matías sigue contando ahí (sigue sumando al numerador y al denominador de esa cursada), aunque su comentario ya no se lea en ningún lado.

**E3.** Dado que el comentario retirado de Matías mencionaba detalles de salud de un tercero
Cuando Rocío descarga el CSV de Método
Entonces no encuentra ese texto en ninguna fila ni columna: el CSV nunca contiene testimonios, se hayan bajado o no.

## Negativos

**N1.** Dado que Nahuel bajó el comentario de Matías por "Vida privada, salud o familia"
Cuando se recalcula la proporción de "Hay clases que no se dan" (F18) en la Cátedra Pérez
Entonces la voz de Matías no se resta ni del numerador ni del denominador de F18: bajar un texto nunca resta una voz.

**N2.** Dado que Método arma el bloque "Cuánto se bajó y por qué" con los conteos por categoría
Cuando se publica ese bloque
Entonces no incluye ningún fragmento del texto retirado, ni siquiera parcial o parafraseado: solo la categoría y el número.

## Edge cases

- Alguien reporta el comentario de Matías el mismo día; mientras Nahuel no resuelve, ese texto sigue publicado y todavía no suma al conteo de bajados de Método.
- Una categoría sin ningún texto bajado en el trimestre (por ejemplo, "Datos de contacto" en cero) se publica igual con su conteo en cero: acá el cero es una medición real (se revisó y no hubo ninguno), no ausencia de dato.

**Falta decidir**: la taxonomía completa de categorías para bajar un texto (la ficha de Reportes lo deja abierto); estos escenarios usan las tres categorías de ejemplo del boceto de Método (Vida privada, salud o familia; Aspecto; Datos de contacto).
