# Escenarios de Entrar

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-220: Recuperar la contraseña con un link al mail

### Camino feliz

**E1.** Dado que Diego tiene una cuenta con el mail diego28@gmail.com y olvidó la contraseña.
Cuando pide el link de Recuperar con ese mail.
Entonces la pantalla confirma que el link salió, sin decir nada más de la cuenta: ni si está activa, ni su situación, ni ningún otro dato.

**E2.** Dado que a Diego le llegó el link de Recuperar y todavía no venció.
Cuando lo abre.
Entonces llega directo a poner la contraseña nueva, y la pantalla no le pregunta situación, institución ni carrera: solo la contraseña nueva.

**E3.** Dado que el link que le llegó a Diego para Recuperar ya venció.
Cuando intenta usarlo.
Entonces la pantalla le dice que el link venció y le ofrece pedir uno nuevo, aclarando que lo que venció es el link, nunca la cuenta ni lo que tiene adentro.

### Negativos

**N1.** Dado que a Ana, al registrarse, se le precargaron institución y carrera desde el mail de su pedido (US-142), y después olvida la contraseña.
Cuando abre el link de Recuperar y llega a poner la contraseña nueva.
Entonces la pantalla no le vuelve a preguntar institución, carrera ni situación: nada de lo que ya declaró se repite acá.

**N2.** Dado que el link de Diego ya venció.
Cuando de todos modos intenta mandar una contraseña nueva con ese link vencido.
Entonces el sistema lo rechaza: no le cambia la contraseña con un link que ya venció.

### Edge cases

- Link vencido: pide uno nuevo, y la cuenta con todo lo que tiene adentro sigue intacta.
- Mail que no existe en el sistema: la pantalla confirma que el link salió, igual que si la cuenta existiera, sin decir que ese mail no está registrado.
- Link ya usado una vez, abierto de nuevo.
- Pedir el link dos veces seguidas, antes de usar el primero.

**Falta decidir**: qué pasa la segunda vez que se abre un link ya usado, si sigue sirviendo o queda invalidado. **Falta decidir**: cuánto dura el link y si pedirlo muchas veces seguidas tiene algún límite, abierto en el README de la épica.

## US-228: Crear la cuenta recién cuando la acción me la pide

### Camino feliz

**E1.** Dado que Matías leyó la Ficha de Cátedra Pérez sin cuenta y quiere votar un testimonio, y llegó a Registro desde ahí.
Cuando completa mail y contraseña, marca que cursa, y manda el formulario.
Entonces la cuenta se crea y el consentimiento informado estaba a la vista antes de mandar, en una línea con el link al aviso de privacidad (Ley 25.326).

**E2.** Dado que Ana pidió que carguen Licenciatura en Psicología de UNSTA, confirmó el mail, y le avisaron que ya está cargada (US-142), y entra a Registro desde ese aviso.
Cuando llega al formulario.
Entonces institución y carrera vienen completas y de solo lectura, con la nota de por qué, y solo tiene que poner mail y contraseña.

**E3.** Dado que Matías ya tiene una cuenta con matias.ferreyra@gmail.com y no se acuerda.
Cuando se registra otra vez con ese mismo mail.
Entonces no se crea una segunda cuenta: la misma pantalla se lo avisa y le ofrece Ingresar, sin borrar lo que ya había escrito.

### Negativos

**N1.** Dado que Matías completó mail, contraseña y su situación, pero no marcó el consentimiento informado.
Cuando manda el formulario.
Entonces la cuenta no se crea: sin consentimiento no hay registro, porque es lo que exige la Ley 25.326 y no un paso opcional.

**N2.** Dado que Matías se registra declarando que da clases.
Cuando la cuenta se crea.
Entonces eso no le da ningún permiso de docente: la cuenta sigue siendo `member` y declararse docente solo abre un reclamo de identidad que alguien del equipo tiene que verificar (US-178). Nada de lo que declara en Registro se publica ni habilita nada.

### Edge cases

- Abandonar el formulario a la mitad y volver más tarde: qué sobrevive.
- Venir de un pedido confirmado cuya carrera después se fusionó con otra canónica (US-195): qué queda precargado.
- Registrarse con un mail que perteneció a una cuenta dada de baja y anonimizada (US-166).
- Mandar el formulario dos veces seguidas por doble clic.

**Falta decidir**: Registro avisa "ese mail ya está registrado" y con eso confirma que la cuenta existe, mientras Recuperar hace lo contrario a propósito (US-220: "sin decir nada más de la cuenta", y su edge case dice que un mail inexistente se responde igual que uno existente). Las dos pantallas tratan el mismo dato con criterios opuestos y ninguna decisión lo resuelve.

## US-229: Entrar y volver a lo que estaba haciendo

### Camino feliz

**E1.** Dado que Matías está leyendo la Ficha de Cátedra Pérez sin sesión y toca "a mí también me pasó" sobre el testimonio de Lucía.
Cuando el gate lo manda a Ingresar.
Entonces la pantalla dice arriba, con esas palabras, por qué está ahí: "para votar esta reseña, necesitás una cuenta".

**E2.** Dado que Matías está en Ingresar habiendo venido de votar ese testimonio.
Cuando entra con sus credenciales correctas.
Entonces vuelve a la Ficha de Cátedra Pérez, en el mismo testimonio, con el voto ya aplicado: no tiene que buscarlo de nuevo ni tocar otra vez.

**E3.** Dado que Matías entra desde el link de Ingresar del pie, sin venir de ninguna acción.
Cuando entra con sus credenciales correctas.
Entonces la sesión se abre y va al lugar por defecto, sin ningún motivo arriba, porque no hubo acción que lo trajera.

### Negativos

**N1.** Dado que Matías escribió su mail bien y la contraseña mal.
Cuando intenta entrar.
Entonces el aviso dice que el mail o la contraseña no coinciden, sin decir cuál de los dos falló y sin borrar lo que ya escribió: no confirma si ese mail tiene cuenta.

### Edge cases

- La sesión expira entre que llega a Ingresar y que manda el formulario.
- Entra en otra pestaña y vuelve a la primera, que todavía cree que no hay sesión.
- La acción que lo trajo ya no es posible cuando vuelve: el testimonio que iba a votar se bajó mientras tanto (US-186).
- Ingresa con una cuenta dada de baja y anonimizada (US-166).

## US-230: Entender que se rompió sin perder lo que venía cargando

### Camino feliz

**E1.** Dado que Silvia entra a la Ficha de carrera de Ingeniería en Sistemas de UNSTA y la carga falla.
Cuando cae en Error.
Entonces lee qué pasó en palabras ("no pudimos cargar esto"), sin código ni jerga a la vista, y tiene dos salidas: probar de nuevo o volver a Explorar.

**E2.** Dado que Matías venía reseñando su cursada de Análisis Matemático II, ya marcó F01 y F18, y la pantalla falla antes de que publique.
Cuando cae en Error.
Entonces lo que ya contestó quedó guardado solo y hay un link para retomarlo desde donde estaba (US-161): no vuelve a empezar.

### Negativos

**N1.** Dado que la falla fue un 500 del backend con su stack trace.
Cuando Matías cae en Error.
Entonces nada de eso aparece en pantalla: ni el código, ni el mensaje interno, ni el nombre del servicio que falló.

### Edge cases

- La falla ocurre justo al publicar la reseña: si se publicó o no, y qué dice la pantalla.
- Cae en Error sin nada a medias que retomar: la tercera línea no aparece.
- Vuelve a fallar al tocar "probar de nuevo".
- Falla estando sin sesión, leyendo algo público.

**Falta decidir**: si el copy distingue 404 de 500, abierto en la ficha de Error.

