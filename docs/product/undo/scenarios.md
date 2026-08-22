# Escenarios de Deshacer

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-165: Editar o borrar lo que conté

### Camino feliz

**E1.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, marcando la frase "Hay clases que no se dan" (F18), que hoy suma 12 de 40 voces (18,1%, ADR-0075).
Cuando Matías entra a Mis aportes, abre ese aporte en Editar y saca la marca de F18 sin borrar el resto del aporte.
Entonces el aporte se actualiza y F18 pasa a sumar 11 de 40 voces (calcular el porcentaje nuevo): la cursada sigue teniendo 40 voces en total, porque Matías sigue siendo una de ellas.

**E2.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, marcando "Hay clases que no se dan" (F18, 12 de 40 voces, 18,1%) y "Te tratan con respeto" (F25, 25 de 40 voces, calcular el porcentaje).
Cuando Matías entra a Mis aportes, elige borrar ese aporte y confirma que no se puede deshacer.
Entonces el aporte deja de contar en cualquier lado: F18 pasa a 11 de 39 voces (16,5%), F25 pasa a 24 de 39 voces (45,9%), y la cursada pasa a tener 39 voces en total.

**E3.** Dado que Lucía tiene publicado un comentario en su reseña de Análisis Matemático II, Cátedra Pérez, UNSTA, ya aprobado por el chequeo previo.
Cuando Lucía entra a Editar y cambia el texto del comentario por uno nuevo que no identifica a nadie ni habla de un tercero fuera de su acto público, y guarda.
Entonces el comentario editado vuelve a pasar el chequeo previo antes de republicarse, y al pasarlo limpio se publica al instante con el texto nuevo.

### Negativos

**N1.** Dado que un aporte publicado le pertenece a Lucía.
Cuando Matías intenta entrar a Editar ese aporte.
Entonces se lo rechaza: a Editar solo entra el dueño del aporte, Matías no puede ver ni tocar aportes de otra cuenta.

**N2.** Dado que Lucía edita su comentario y escribe algo que habla de una persona fuera de su acto público (por ejemplo, de la vida privada de un docente, no de su forma de dar clase).
Cuando guarda la edición.
Entonces el comentario editado no se publica al instante: queda retenido hasta que alguien del equipo lo mire, y se le avisa a Lucía; mientras tanto, las frases que había marcado siguen contando igual.

**N3.** Dado que Matías tiene un aporte publicado con el comentario ya aprobado y la frase F18 marcada.
Cuando entra a Editar, destilda F18 sin tocar el texto del comentario, y guarda.
Entonces el comentario no vuelve a pasar el chequeo previo, porque no lo tocó: solo se actualiza el conteo de F18.

**N4.** Dado que Diego declaró que entró en 2019 y que se fue en 2023, dos hechos de trayectoria distintos.
Cuando quiere sacar los dos de una sola acción.
Entonces no existe un borrado en bloque: cada hecho se borra de a uno, con su propio botón Borrar al lado, nunca los dos juntos.

### Edge cases

- Una reseña con réplica ya publicada de la cátedra: Matías la edita o la borra igual, de a una.
- Una reseña pendiente de vincular (la materia que nombró todavía no está en el catálogo) se edita igual, con el aviso de que todavía no cuenta en ninguna ficha.
- Un comentario que ya está retenido por el chequeo previo se vuelve a editar antes de que alguien del equipo lo haya mirado la primera vez.

**Falta decidir**: qué pasa con una réplica ya publicada si Matías edita o borra después el testimonio que la motivó, ni ADR-0068 ni el flujo de Replicar lo dicen.

## US-166: Sacar lo mío y después irme

### Camino feliz

**E1.** Dado que Lucía tiene la cuenta con mail lucia23@gmail.com, reseñas publicadas y la carrera Ingeniería en Sistemas en UNSTA declarada.
Cuando Lucía confirma la Baja de su cuenta.
Entonces su nombre se borra, su mail se reemplaza por un hash irreversible que nadie puede usar para volver a lucia23@gmail.com, y su contraseña deja de servir.

**E2.** Dado que Lucía reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, marcando "Hay clases que no se dan" (F18, 12 de 40 voces, 18,1%), y declaró que entró en 2020 a Ingeniería en Sistemas en UNSTA.
Cuando Lucía confirma la Baja.
Entonces la reseña sigue publicada con F18 todavía en 12 de 40 voces (18,1%), sin ningún cambio, y el hecho "entró en 2020" sigue contando exacto en la cohorte 2020 de esa carrera, ya sin nombre ni cuenta detrás.

**E3.** Dado que Lucía llega a Baja desde Mi perfil, todavía sin confirmar nada.
Cuando lee la pantalla antes de tocar el botón final.
Entonces ve, con esas palabras, que su nombre se borra, que su mail se convierte en un hash irreversible, que sus reseñas y sus hechos de trayectoria quedan publicados exactos y sin ella atrás, y que la acción es irreversible.

### Negativos

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

### Edge cases

- Una cuenta que nunca aportó nada (solo leyó, nunca reseñó ni votó) se da de baja igual: se anonimiza aunque no había nada que preservar.
- Una cuenta que solo votó reseñas de otras personas, sin escribir ninguna propia, se da de baja: sus votos siguen sumando voz a esas frases igual que antes.

**Falta decidir**: qué pasa con una réplica ya publicada sobre un testimonio de una cuenta que se dio de baja, no está resuelto en ninguna decisión (lo mismo que en Editar, US-165). **Falta decidir**: qué pasa si el aporte de una cuenta que se da de baja tiene un comentario retenido por el chequeo previo que todavía nadie del equipo miró, ningún documento lo dice.

## US-167: Reportar algo sin registrarme

### Camino feliz

**E1.** Dado que en la ficha de Análisis Matemático II, Cátedra Paredes, UNSTA hay un testimonio publicado que habla de la vida privada de Prof. Paredes, fuera de su rol docente.
Cuando Prof. Paredes hace click en Reportar sobre ese testimonio sin haberse registrado en plan-b, elige un motivo y deja su mail.
Entonces el reporte se manda sin pedirle ninguna cuenta ni contraseña.

**E2.** Dado que Prof. Paredes ya mandó el reporte con su mail.
Cuando recibe el mail de confirmación y hace click en el link.
Entonces recién ahí el reporte entra a la cola de Reportes que ve Nahuel; antes de ese click no aparecía ahí.

**E3.** Dado que el mismo testimonio recibió 8 reportes de 8 mails distintos, todos confirmados, contra la misma cátedra, dentro de una ventana de 72 horas.
Cuando todavía nadie del equipo de moderación revisó el caso.
Entonces el testimonio sigue publicado igual: los 8 reportes no lo bajan solos, recién se baja si Nahuel lo revisa y decide bajar el texto con una categoría.

### Negativos

**N1.** Dado que alguien reporta un testimonio y nunca hace click en el link de confirmación del mail.
Cuando pasa el tiempo.
Entonces ese reporte nunca entra a la cola de Reportes: Nahuel no llega a verlo.

**N2.** Dado que Prof. Paredes, sin cuenta en plan-b, quiere reportar un testimonio.
Cuando hace click en Reportar y completa el modal.
Entonces el sistema no le pide crear una cuenta ni iniciar sesión en ningún paso del reporte.

**N3.** Dado que el mismo mail de Prof. Paredes manda dos reportes confirmados sobre el mismo testimonio.
Cuando Nahuel abre la cola.
Entonces cuenta como un solo reporte, no dos: el mail confirmado deduplica.

**N4.** Dado que un reporte dice que la cátedra de Análisis Matemático II, Cátedra Paredes, es un desastre y que toda la facultad debería revisarla, sobre un testimonio que solo marca frases duras contra esa cátedra, sin exponer a ninguna persona.
Cuando Nahuel lo revisa.
Entonces no lo baja: una queja dura contra la cátedra o la institución no es causal, aunque sea muy dura.

### Edge cases

- Un caso de riesgo inmediato es el único que se despublica antes de que Nahuel lo resuelva.
- Reportes contra la misma cátedra en una ventana de 72 horas, pero de mails que nunca se confirmaron, no se agrupan porque nunca entraron a la cola.

**Falta decidir**: el texto exacto del criterio escrito de riesgo inmediato, la épica lo señala como pendiente de redactar. **Falta decidir**: cómo se responde a un reporte cuyo mail confirmado rebota.
