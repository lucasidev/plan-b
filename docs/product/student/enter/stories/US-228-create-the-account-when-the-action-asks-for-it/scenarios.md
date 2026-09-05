# US-228: Crear la cuenta recién cuando la acción me la pide

> Los casos de [US-228](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías leyó la Ficha de Cátedra Pérez sin cuenta y quiere reseñar esa cursada, y llegó a Registro desde ahí.
Cuando completa mail y contraseña, marca que cursa, y manda el formulario.
Entonces la cuenta se crea y el consentimiento informado estaba a la vista antes de mandar, en una línea con el link al aviso de privacidad (Ley 25.326).
No construido: el consentimiento informado y el aviso de privacidad quedan para el sprint con personas reales, como N1; el registro de hoy pide mail, contraseña y carrera (ADR-0086), sin marcar que cursa

**E2.** Dado que Ana pidió que carguen Licenciatura en Psicología de UNSTA, confirmó el mail, y le avisaron que ya está cargada (US-142), y entra a Registro desde ese aviso.
Cuando llega al formulario.
Entonces institución y carrera vienen completas y de solo lectura, con la nota de por qué, y solo tiene que poner mail y contraseña.
No construido: la carrera precargada desde un pedido de carga depende de US-140 a US-142 (Backlog)

**E3.** Dado que Matías ya tiene una cuenta con matias.ferreyra@gmail.com y no se acuerda.
Cuando se registra otra vez con ese mismo mail.
Entonces la pantalla dice lo mismo que diría con cualquier dirección ("te mandamos un mail a matias.ferreyra@gmail.com"), no se crea una segunda cuenta, y el mail que le llega le avisa que alguien intentó registrarse con su dirección y le ofrece Ingresar o Recuperar (ADR-0076).

## Negativos

**N1.** Dado que Matías completó mail, contraseña y su situación, pero no marcó el consentimiento informado.
Cuando manda el formulario.
Entonces la cuenta no se crea: sin consentimiento no hay registro, porque es lo que exige la Ley 25.326 y no un paso opcional.
No construido: el consentimiento informado queda para el sprint con personas reales (R4 lo deja afuera a propósito)

**N2.** Dado dos direcciones, matias.ferreyra@gmail.com que ya tiene cuenta y sin.cuenta@gmail.com que no.
Cuando alguien manda el formulario de Registro con cada una.
Entonces las dos respuestas son indistinguibles: mismo texto, mismos elementos en pantalla, misma forma de terminar. Lo único que difiere es el mail que llega a cada dirección, y a esa casilla solo entra su dueño. Es lo que impide averiguar quién aportó preguntándole al formulario (ADR-0076).

**N3.** Dado que Matías se registra declarando que da clases.
Cuando la cuenta se crea.
Entonces eso no le da ningún permiso de docente: la cuenta sigue siendo `member` y declararse docente solo abre un reclamo de identidad que alguien del equipo tiene que verificar (US-178). Nada de lo que declara en Registro se publica ni habilita nada.
No construido: la identidad docente se rehace desde US-172 y US-227 (ADR-0019, revisión del 2026-09-03)

## Edge cases

- Abandonar el formulario a la mitad y volver más tarde: qué sobrevive.
- Venir de un pedido confirmado cuya carrera después se fusionó con otra canónica (US-195): qué queda precargado.
- Registrarse con un mail que perteneció a una cuenta dada de baja y anonimizada (US-166).
- Mandar el formulario dos veces seguidas por doble clic.
- El tiempo de respuesta: si crear una cuenta tarda notoriamente más que no crearla, el reloj contesta lo que la pantalla calla (ADR-0076).

**Falta decidir**: si el link de confirmación deja la sesión abierta al volver, para que quien venía disparando una acción la complete sin escribir la contraseña otra vez (abierto en ADR-0076, se decide al construir US-229).
