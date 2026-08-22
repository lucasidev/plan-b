# ADR-0076: The three doors answer the same whether the account exists or not

- **Estado**: propuesto
- **Fecha**: 2026-08-21
- **Resuelve**: la contradicción entre [US-228](../product/enter/stories/US-228-create-the-account-when-the-action-asks-for-it.md) y [US-220](../product/enter/stories/US-220-recover-the-password-by-mail.md)

## Contexto

Las tres puertas del producto tratan el mismo dato con criterios opuestos, y nadie lo decidió:

- **Recuperar** oculta a propósito si la cuenta existe. [US-220](../product/enter/stories/US-220-recover-the-password-by-mail.md): *"la pantalla confirma que salió, sin decir nada más de la cuenta"*, y su escenario borde lo dice entero: un mail que no existe se responde igual que uno que sí.
- **Ingresar** también: [US-229](../product/enter/stories/US-229-sign-in-and-land-back-on-what-i-was-doing.md) avisa que el mail o la contraseña no coinciden, sin decir cuál de los dos falló.
- **Registro**, en cambio, lo revela. La ficha de la pantalla declara un estado *"mail ya registrado"* con aviso inline y links a Ingresar y a Recuperar.

**La asimetría no es solo incoherente: hace que la protección no valga nada.** Si el formulario de registro contesta "ese mail ya tiene cuenta", ocultarlo en Recuperar no protege nada, porque quien quiera saberlo pregunta por la otra puerta. Hoy se paga el costo de ocultar en dos pantallas y no se obtiene el beneficio en ninguna.

**Y acá enumerar cuentas no revela lo mismo que en cualquier otra aplicación.** La tesis fija que [leer no pide cuenta y producir sí](../THESIS.md) (decisión 3): una cuenta existe únicamente porque alguien quiso aportar. Entonces confirmar que un mail tiene cuenta no dice "esta persona se registró": dice **"esta persona aportó a planb"**. Es exactamente el dato que el producto promete no publicar ([US-159](../product/write-a-review/stories/US-159-no-data-crossing-identifies-me.md): nada publicado trae nombre, cuenta ni perfil), frente al adversario que la tesis nombra: la institución de la que se habla. Publicar con cuidado y filtrarlo en la puerta es no protegerlo.

## Decisión

**Las tres puertas responden igual exista o no la cuenta, y lo que diferencia los dos casos viaja por el canal privado.**

1. **Registro responde siempre lo mismo**: que se mandó un mail a esa dirección. En pantalla no hay ningún estado que distinga un mail libre de uno ya registrado. El estado *"mail ya registrado"* de la ficha se retira.
2. **El mail resuelve la diferencia.** Si la dirección estaba libre, trae el link para confirmar y terminar de crear la cuenta. Si ya tenía cuenta, dice que alguien intentó registrarse con esa dirección y ofrece Ingresar o Recuperar, sin crear nada.
3. **Con esto el registro confirma el mail por link**, que era la pregunta que el README de Entrar dejaba abierta. Queda alineado con D03, que ya fijó la confirmación por link para el pedido y el reporte: un mail confirmado es la prueba de que esa dirección existe, y acá además es lo que evita crear cuentas a nombre de terceros.
4. **La regla vale para las tres puertas y se enuncia una sola vez**: ninguna pantalla de acceso revela si una dirección tiene cuenta. Recuperar e Ingresar ya lo cumplían; Registro se alinea.

## Alternativas consideradas

**A. Dejar la asimetría como está.** Es el peor de los dos mundos: el costo de ocultar en Recuperar e Ingresar, y cero beneficio, porque la respuesta está a un formulario de distancia. Descartada, y es la razón por la que este ADR existe.

**B. Revelar en las tres.** Al menos es coherente, y la UX del que se olvidó de que tenía cuenta es mejor: lo ve en pantalla y no en el mail. Se descarta porque el dato que filtra es "esta persona aportó", en un producto cuya promesa central es que eso no se sabe, y contra un adversario con motivo. Coherencia no alcanza cuando lo coherente es filtrar.

**C. Rate limiting o captcha en vez de respuesta genérica.** Encarecen enumerar en masa y no resuelven el caso que importa acá, que no es masivo: una institución preguntando por **una** persona concreta necesita una sola consulta. Sirven como defensa adicional contra el barrido, no como reemplazo. No se descartan como medida, se descartan como respuesta a esto.

**D. Revelar solo a quien ya probó tener el mail.** Coherente en teoría y sin caso de uso: si ya probaste tener el mail, entrás.

## Consecuencias

- **[US-228](../product/enter/stories/US-228-create-the-account-when-the-action-asks-for-it.md) cambia su tercer criterio**, y la ficha de Registro cambia sus estados: se va *"mail ya registrado"*, entra *"te mandamos un mail"*.
- **El registro gana un ida y vuelta al mail.** Es un paso más, y hay que decirlo: quien se olvidó de que tenía cuenta ya no se entera en pantalla. A cambio, nadie averigua quién aportó preguntándole al formulario. El costo se paga una vez por persona, no por reseña, así que no toca los cinco minutos que pide [US-146](../product/write-a-review/stories/US-146-review-in-under-five-minutes.md), que son los de reseñar.
- **Queda una pregunta abierta que este ADR no resuelve**: si el link de confirmación deja la sesión abierta al volver, para que quien venía disparando una acción la complete sin escribir la contraseña de nuevo. Es UX del flujo, se decide al construir [US-229](../product/enter/stories/US-229-sign-in-and-land-back-on-what-i-was-doing.md).
- **La respuesta genérica tiene que serlo también en el tiempo**: si crear una cuenta tarda notoriamente más que no crearla, el reloj contesta lo que la pantalla calla. Es una nota de implementación, no un requisito de producto, y va al plan.

## Refs

- [THESIS.md](../THESIS.md) decisión 3 (leer no pide cuenta, producir sí: por eso una cuenta es un aporte), [ADR-0009](0009-review-anonymity-is-a-presentation-rule.md) (el anonimato es regla de presentación), [ADR-0044](0044-soft-delete-of-the-user-with-corpus-preservation.md) (la baja anonimiza y preserva).
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) y [Email Validation and Verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html): respuesta genérica en registro y resolución por el canal verificado.
