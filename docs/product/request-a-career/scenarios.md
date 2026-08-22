# Escenarios de Pedir una carrera

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-139: Saber si el vacío es de ustedes

### Camino feliz

**E1.** Dado que "Contador Público, Siglo 21" tiene 34 pedidos confirmados en la cola pero Sofía todavía no la cargó al catálogo,
Cuando Ana la busca en Buscar o la mira en Explorar,
Entonces el resultado dice "no la cargamos todavía" (nunca "sin resultados" a secas ni un espacio en blanco), con el link a Pedir al lado.

**E2.** Dado que "Licenciatura en Psicología, UNSTA" se cargó la semana pasada y todavía ninguna cursada la reseñó,
Cuando Ana entra a su Ficha de carrera,
Entonces la ficha dice que arranca vacía y que la primera voz ya se publica, sin escalones: nunca "0%" ni una sección en blanco sin explicación.

**E3.** Dado que "Ingeniería en Sistemas, UNSTA" está cargada y tiene voces en 22 de sus 40 materias canónicas (menos de la mitad),
Cuando Ana entra a su Ficha de carrera,
Entonces la cabecera dice "todavía no derivamos" con "22 de 40 materias con voces" a la vista, y deja leer materia por materia en vez de esconder lo que sí hay.

### Negativos

**N1.** Dado que "Licenciatura en Psicología, UNSTA" está cargada y sin voces, cuando se renderiza su Ficha de carrera, entonces NO muestra ninguna proporción en 0% ni una cabecera vacía sin texto: tiene que decir explícitamente que arranca vacía.

**N2.** Dado que "Contador Público, Siglo 21" todavía no está cargada (está en la cola, no en el catálogo), cuando Ana la busca, entonces el resultado NO dice "cargada, sin voces todavía" (eso implicaría que ya existe en el catálogo): dice "no la cargamos todavía", con el link a Pedir.

### Edge cases

- La transición de "cargada, sin voces" a "cargada, con voces, todavía no derivamos" ocurre con la primera reseña que entra: no hay un cuarto estado intermedio entre los tres que la ficha distingue.
- Buscar devuelve una carrera cargada sin voces o sin cabecera como un resultado normal, con su propio estado a la vista, nunca como "sin resultados": eso queda reservado para cuando de verdad no hay nada con ese nombre.

## US-140: Pedir la carga sin registrarme

### Camino feliz

**E1.** Dado que Ana completa institución (UTN, Facultad Regional Tucumán), carrera (Ingeniería en Sistemas de Información) y su mail (ana.paez@gmail.com) en Pedir, sin que se le pida contraseña ni ningún otro dato de cuenta,
Cuando manda el pedido,
Entonces plan-b le manda un mail para confirmar, y el pedido queda en "mail enviado": todavía no suma al conteo público.

**E2.** Dado que Ana confirma desde el link de ese mail,
Cuando vuelve a Pedir,
Entonces ve "tu pedido cuenta: sos el 23° que la pide", y La cola pasa a mostrar 23 pedidos confirmados para "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán".

### Negativos

**N1.** Dado que Ana pide "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán" pero nunca hace click en el link de confirmación, cuando pasa el tiempo sin que confirme, entonces su pedido NO entra a la cola ni cuenta como reclamo: el conteo público de esa carrera no se mueve por su pedido.

**N2.** Dado que Ana ya pidió "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán" con ana.paez@gmail.com y la confirmó, cuando vuelve a pedir la misma carrera con el mismo mail, entonces el pedido NO se duplica: sigue contando una sola vez (D03), y La cola sigue en 23 pedidos confirmados, no pasa a 24.

### Edge cases

- Pedir algo ambiguo, como "la carrera de sistemas de la UTN de acá" en vez del nombre exacto: la épica todavía no resuelve si Pedir ofrece elegir de una lista de instituciones conocidas o acepta texto libre que Sofía interpreta después. **Falta decidir**.
- Un mail que rebota al mandar la confirmación: ninguna fuente dice si se avisa de otra forma o el pedido queda mudo. **Falta decidir**.
- Pedir con una institución que no existe en ningún catálogo conocido, tipeada a mano: no hay criterio escrito de si Pedir la acepta igual, la rechaza, o la deja pendiente de que Sofía la interprete. **Falta decidir**.

## US-141: Ver cuántos más la pidieron

### Camino feliz

**E1.** Dado que Rocío no tiene cuenta en plan-b,
Cuando entra a La cola,
Entonces ve la lista completa de carreras pedidas sin que se le pida iniciar sesión en ningún momento.

**E2.** Dado que las carreras pedidas tienen 34, 23, 21, 19, 18, 17, 16, 15, 9 y 4 pedidos confirmados respectivamente: "Contador Público, Siglo 21"; "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán"; "Profesorado en Educación Física, Siglo 21"; "Ingeniería Industrial, UTN Facultad Regional Tucumán"; "Licenciatura en Enfermería, UNSTA"; "Contador Público, UNSTA"; "Tecnicatura en Higiene y Seguridad, Siglo 21"; "Profesorado en Matemática, UNT"; "Abogacía, USPT"; "Tecnicatura en Programación, Siglo 21",
Cuando Ana abre La cola,
Entonces las ve en ese mismo orden, de mayor a menor cantidad de pedidos confirmados, con "Contador Público, Siglo 21" primera y "Tecnicatura en Programación, Siglo 21" última.

### Negativos

**N1.** Dado que Ana pidió "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán", cuando cualquiera (con o sin cuenta) mira La cola, entonces NO ve el mail ana.paez@gmail.com ni ningún otro dato de quién pidió cada carrera: solo el conteo total de 23.

**N2.** Dado que "Contador Público, Siglo 21" lleva 34 pedidos confirmados, cuando alguien mira su fila en La cola, entonces NO hay ninguna fecha de entrega prometida para esa carrera puntual: solo el promedio general de cuánto se tarda.

### Edge cases

- El primer día, sin pedidos todavía, La cola no se muestra vacía sin contexto: explica el criterio propio con el que Sofía carga mientras no hay demanda (US-203). **Falta decidir**: el copy exacto de ese criterio de arranque.
- Una carrera pasa de pedida a cargada (por ejemplo, "Licenciatura en Psicología, UNSTA" con 41 pedidos confirmados): deja de mostrar el conteo y muestra "Ya está: ver ficha" en su lugar.
- Dos carreras empatadas en pedidos confirmados: ninguna fuente fija cuál va primero. **Falta decidir**.

## US-142: Que me avisen cuando la carguen

### Camino feliz

**E1.** Dado que Ana confirmó su pedido de "Licenciatura en Psicología, UNSTA" y Sofía la carga, llegando a 41 pedidos confirmados,
Cuando plan-b la marca como cargada,
Entonces le llega un mail "cargamos lo que pediste" a ana.paez@gmail.com con el link a la ficha, y Ana puede abrirla y leerla sin iniciar sesión.

**E2.** Dado que Ana hace click en "Registrarme" desde ese mail,
Cuando llega a Registro,
Entonces institución (UNSTA) y carrera (Licenciatura en Psicología) aparecen precargadas y de solo lectura, con la nota de por qué, y el formulario no se las vuelve a preguntar.

### Negativos

**N1.** Dado que Ana pidió "Contador Público, UNSTA" pero nunca confirmó el mail (su pedido nunca entró a la cola), cuando esa carrera se carga más adelante, entonces Ana NO recibe el mail "cargamos lo que pediste": su pedido nunca contó, así que no hay a quién avisarle por él.

### Edge cases

- El mail de aviso ("cargamos lo que pediste") rebota: ninguna fuente dice qué pasa, y es distinto del rebote en el mail de confirmación del pedido inicial. **Falta decidir**.
- Ana ya tenía una cuenta creada antes de que cargaran la carrera que pidió sin cuenta: si el aviso igual le llega a esa casilla y cómo se asocia con su cuenta ya existente, en vez de ofrecerle registrarse de nuevo, no está resuelto. **Falta decidir**.
