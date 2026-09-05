# US-166: Sacar lo mío y después irme

> Los casos de [US-166](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía tiene la cuenta con mail lucia23@gmail.com, reseñas publicadas y la carrera Ingeniería en Sistemas en UNSTA declarada.
Cuando Lucía confirma la Baja de su cuenta.
Entonces su nombre se borra, su mail se reemplaza por un hash irreversible que nadie puede usar para volver a lucia23@gmail.com, y su contraseña deja de servir.

**E2.** Dado que Lucía reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, respondiendo "Faltaron muchas" en "¿Se dictaron las clases?" (12 de 40 voces).
Cuando Lucía confirma la Baja.
Entonces la reseña sigue publicada con esa respuesta todavía en 12 de 40 voces, sin ningún cambio, ya sin nombre ni cuenta detrás.

**E3.** Dado que Lucía llega a Baja desde Mi perfil, todavía sin confirmar nada.
Cuando lee la pantalla antes de tocar el botón final.
Entonces ve, con esas palabras, que su nombre y su mail se anonimizan y no se recuperan, que lo que reseñó sigue contando en los conteos de su cátedra sin nada que lleve a ella, y que la acción es irreversible.

## Negativos

**N1.** Dado que Lucía ya confirmó la Baja.
Cuando intenta volver a entrar con su mail y contraseña viejos, o pide recuperar la cuenta.
Entonces no hay ninguna forma de recuperarla ni de volver a ver su mail original: si quiere volver, tiene que registrarse de cero con una cuenta nueva.

**N2.** Dado que Lucía tiene tres reseñas publicadas y una de ellas, con algo en el campo libre que la incomoda, quiere que no quede ni siquiera anonimizada.
Cuando confirma la Baja directamente, sin pasar antes por Editar para borrar esa reseña puntual.
Entonces esa reseña no se borra por dar de baja la cuenta: queda publicada, anonimizada, igual que las otras dos; lo único que la saca del todo es borrarla antes, de a una, desde Editar (US-165).

**N3.** Dado que Lucía declaró que entró en 2020 a Ingeniería en Sistemas en UNSTA, un dato personal no publicado que dispara el reenganche anual.
Cuando Lucía se da de baja.
Entonces ese dato deja de dispararle ningún mail (no queda cuenta activa a la que mandárselo) y no alimenta ningún agregado publicado: la duración real y el egreso por cohorte de esa carrera son dato oficial (SPU/CONEAU) y no dependen de lo que ninguna cuenta haya declarado.
No construido: no existe el reenganche anual (US-156, Backlog) ni ningún agregado publicado que use el año de ingreso

**N4.** Dado que la cuenta de Lucía ya está anonimizada desde ayer.
Cuando alguien intenta ejecutar la Baja de nuevo sobre esa misma cuenta.
Entonces se rechaza: no existe una segunda anonimización sobre una cuenta que ya no tiene sesión activa para confirmarla.

**N5.** Dado que Lucía todavía no confirmó la Baja.
Cuando mira la pantalla antes de decidir.
Entonces no ve un resumen inventado de lo que va a perder ni un cero armado para la ocasión: si tiene aportes que puntualmente prefiere sacar antes, los ve listados con un link a Editar; si no tiene ninguno, la pantalla no inventa un número.
No construido: la pantalla de baja no lista los aportes con un link a Editar; remite a Mis aportes, donde se sacan de a uno

**N6.** Dado que Lucía entró a Baja y leyó las palabras exactas de qué implica.
Cuando se arrepiente y cierra la pantalla sin tocar el botón de confirmar.
Entonces no pasa nada: su cuenta sigue activa, con su mail y su nombre intactos.

## Edge cases

- Una cuenta que nunca aportó nada (solo leyó, nunca reseñó) se da de baja igual: se anonimiza aunque no había nada que preservar.
