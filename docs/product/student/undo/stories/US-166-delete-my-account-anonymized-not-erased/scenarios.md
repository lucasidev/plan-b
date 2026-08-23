# US-166: Sacar lo mío y después irme

> Los casos de [US-166](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía tiene la cuenta con mail lucia23@gmail.com, reseñas publicadas y la carrera Ingeniería en Sistemas en UNSTA declarada.
Cuando Lucía confirma la Baja de su cuenta.
Entonces su nombre se borra, su mail se reemplaza por un hash irreversible que nadie puede usar para volver a lucia23@gmail.com, y su contraseña deja de servir.

**E2.** Dado que Lucía reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, marcando "Hay clases que no se dan" (F18, 12 de 40 voces, 18,1%), y declaró que entró en 2020 a Ingeniería en Sistemas en UNSTA.
Cuando Lucía confirma la Baja.
Entonces la reseña sigue publicada con F18 todavía en 12 de 40 voces (18,1%), sin ningún cambio, y el hecho "entró en 2020" sigue contando exacto en la cohorte 2020 de esa carrera, ya sin nombre ni cuenta detrás.

**E3.** Dado que Lucía llega a Baja desde Mi perfil, todavía sin confirmar nada.
Cuando lee la pantalla antes de tocar el botón final.
Entonces ve, con esas palabras, que su nombre se borra, que su mail se convierte en un hash irreversible, que sus reseñas y sus hechos de trayectoria quedan publicados exactos y sin ella atrás, y que la acción es irreversible.

## Negativos

**N1.** Dado que Lucía ya confirmó la Baja.
Cuando intenta volver a entrar con su mail y contraseña viejos, o pide recuperar la cuenta.
Entonces no hay ninguna forma de recuperarla ni de volver a ver su mail original: si quiere volver, tiene que registrarse de cero con una cuenta nueva.

**N2.** Dado que Lucía tiene tres reseñas publicadas y una de ellas, con un comentario que la incomoda, quiere que no quede ni siquiera anonimizada.
Cuando confirma la Baja directamente, sin pasar antes por Editar para borrar esa reseña puntual.
Entonces esa reseña no se borra por dar de baja la cuenta: queda publicada, anonimizada, igual que las otras dos; lo único que la saca del todo es borrarla antes, de a una, desde Editar (US-165).

**N3.** Dado que Lucía declaró "entré en 2020" a Ingeniería en Sistemas en UNSTA, y esa cohorte 2020 todavía no está cerrada.
Cuando Lucía se da de baja.
Entonces su hecho sigue exacto como 2020, nunca se generaliza a un rango de años, y la cohorte 2020 no se recalcula ni se cierra antes de tiempo por su baja.

**N4.** Dado que la cuenta de Lucía ya está anonimizada desde ayer.
Cuando alguien intenta ejecutar la Baja de nuevo sobre esa misma cuenta.
Entonces se rechaza: no existe una segunda anonimización sobre una cuenta que ya no tiene sesión activa para confirmarla.

**N5.** Dado que Lucía todavía no confirmó la Baja.
Cuando mira la pantalla antes de decidir.
Entonces no ve un resumen inventado de lo que va a perder ni un cero armado para la ocasión: si tiene aportes que puntualmente prefiere sacar antes, los ve listados con un link a Editar; si no tiene ninguno, la pantalla no inventa un número.

**N6.** Dado que Lucía entró a Baja y leyó las palabras exactas de qué implica.
Cuando se arrepiente y cierra la pantalla sin tocar el botón de confirmar.
Entonces no pasa nada: su cuenta sigue activa, con su mail y su nombre intactos.

**N7.** Dado que un comentario de Lucía, ya publicado, tiene un reporte confirmado esperando en la cola de Reportes.
Cuando Lucía confirma la Baja antes de que Nahuel resuelva ese reporte.
Entonces la Baja sigue adelante igual: se anonimiza su identidad, y el reporte se sigue resolviendo igual que antes, ahora sobre contenido de una cuenta ya anonimizada.

## Edge cases

- Una cuenta que nunca aportó nada (solo leyó, nunca reseñó ni votó) se da de baja igual: se anonimiza aunque no había nada que preservar.
- Una cuenta que solo votó reseñas de otras personas, sin escribir ninguna propia, se da de baja: sus votos siguen sumando voz a esas frases igual que antes.

**Falta decidir**: qué pasa con una réplica ya publicada sobre un testimonio de una cuenta que se dio de baja, no está resuelto en ninguna decisión (lo mismo que en Editar, US-165). **Falta decidir**: qué pasa si el aporte de una cuenta que se da de baja tiene un comentario retenido por el chequeo previo que todavía nadie del equipo miró, ningún documento lo dice.
