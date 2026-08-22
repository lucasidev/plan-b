# Escenarios de Cortar los accesos

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-215: Cada rol ve solo sus colas

### Camino feliz

**E1.** Dado que Sofía tiene asignado el rol catálogo en Equipo
Cuando intenta entrar a la cola de Reportes escribiendo su URL directamente en el navegador
Entonces no accede: el sistema no le muestra el contenido de esa cola.

**E2.** Dado que Sofía tiene asignado el rol catálogo
Cuando intenta entrar a la cola de Verificaciones por URL directa
Entonces tampoco accede: mismo resultado que con Reportes.

### Negativos

**N1.** Dado que Nahuel tiene asignado el rol moderación, cuando intenta entrar por URL directa a Pedidos (una cola de catálogo), entonces no accede: ningún rol llega a la cola de otro, ni por URL directa.

**N2.** Dado que Camila tiene asignado el rol verificación, cuando intenta entrar por URL directa a Correcciones (otra cola de catálogo), entonces tampoco accede.

### Edge cases

- Alguien copia el link de una cola ajena desde la sesión de otra persona del equipo y lo pega en la propia: el bloqueo depende del rol y la sesión de quien lo abre, no del link en sí.
- El Admin no tiene ningún rol operativo asignado: si puede leer el contenido de una cola sin operarla no está decidido (README de la épica).
- Una cuenta recién dada de alta en Equipo, todavía sin ningún rol asignado, intenta entrar a cualquier cola antes de que el Admin le asigne uno.
- El rol "curaduría de frases" no tiene a nadie asignado todavía y ninguna fuente dice si es un rol aparte de catálogo o el mismo (README de la épica): a qué cola exacta entraría queda abierto.

## US-216: Registrar quién hizo cada cosa

### Camino feliz

**E1.** Dado que la carrera Ingeniería en Sistemas de Información de UTN espera en Pedidos con 34 mails confirmados
Cuando Sofía (rol catálogo) la marca como cargada el 2026-08-21
Entonces la acción queda en el registro con autor "Sofía" y fecha "2026-08-21".

**E2.** Dado que un testimonio de Cátedra Fernández (Análisis Matemático II, UNSTA) nombra con nombre y apellido a un ayudante de cátedra
Cuando Nahuel (rol moderación) lo baja en Reportes el 2026-08-21 con la categoría "exposición de un tercero"
Entonces la acción queda en el registro con autor "Nahuel" y fecha "2026-08-21".

**E3.** Dado que Matías subió su certificado de alumno regular en Verificar
Cuando Camila (rol verificación) lo aprueba en Verificaciones el 2026-08-21
Entonces la acción queda en el registro con autor "Camila" y fecha "2026-08-21".

### Negativos

**N1.** Dado cualquier acción sobre una cola (marcar cargada, bajar un texto, resolver una constancia), cuando esa acción se guarda en el registro, entonces nunca queda sin autor ni sin fecha: no existe una fila de acción anónima.

### Edge cases

- Si el equipo creciera y hubiera dos personas con el mismo rol (un segundo catálogo, por ejemplo), cada fila del registro identifica a la persona, no solo el rol.
- Dos acciones sobre la misma fila en momentos distintos (Nahuel deja publicado un reporte y más tarde otro reporte sobre lo mismo lo baja): si el registro guarda las dos acciones o solo la última no está decidido.
- El registro es interno del equipo: nadie fuera de él lo lee directo, salvo lo que sale agregado en US-218.

## US-217: Verificación y moderación son roles excluyentes

### Camino feliz

**E1.** Dado que Nahuel ya tiene asignado el rol moderación
Cuando el Admin intenta asignarle también el rol verificación en Equipo
Entonces la asignación es imposible: la opción no está disponible, no es algo que se registre para auditar después.

**E2.** Dado que Camila ya tiene asignado el rol verificación
Cuando el Admin intenta asignarle también el rol moderación
Entonces también es imposible, en el mismo sentido que E1.

**E3.** Dado que el registro guarda, por separado, la acción de Camila aprobando la constancia de un alumno (con su nombre real) y la acción de Nahuel bajando un testimonio de esa misma cátedra
Cuando Nahuel o Camila leen el registro con su propio rol
Entonces ninguno de los dos encuentra ahí una referencia que le permita unir ese nombre real con ese testimonio o esa cuenta: las referencias que ve un rol no alcanzan para reconstruir el cruce.

**E4.** Dado que el Admin está en Equipo
Cuando intenta asignarse a sí mismo el rol catálogo, curaduría de frases, moderación o verificación
Entonces la asignación es imposible: el Admin no se auto-asigna ningún rol operativo.

### Negativos

**N1.** Dado que el Admin necesita cubrir una ausencia (por ejemplo, Camila de licencia) y busca alguna opción para asignar moderación y verificación a la misma persona por esta vez, cuando la busca en Equipo, entonces no existe: ninguna combinación de permisos habilita esa mezcla, ni siquiera de forma temporal.

### Edge cases

- El Admin intenta asignarle el rol moderación a Nahuel una segunda vez, cuando ya lo tiene: si es un error visible o simplemente no hace nada no está decidido.
- Cómo se cubre la cola de verificación si Camila está de licencia sin violar la exclusión: hace falta un segundo verificador, nunca un moderador supliendo, y quién es ese segundo verificador no está decidido (README de la épica).
- El Admin le saca el rol moderación a Nahuel y se lo da a otra persona nueva; después intenta darle verificación a Nahuel, que hoy no tiene ningún rol: si alcanza con que hoy no lo tenga, o el sistema recuerda que lo tuvo, no está decidido.

## US-218: Revisar lo que hizo el equipo

### Camino feliz

**E1.** Dado que en agosto de 2026 Nahuel bajó 3 testimonios (2 por exposición de un tercero, 1 por publicar el contacto de una persona) y el chequeo previo retuvo 4 comentarios que nunca se publicaron
Cuando cualquiera entra al registro público en agregado (Equipo o Anonimato)
Entonces ve esos números por categoría (3 bajados: 2 exposición de terceros, 1 datos de contacto; 4 retenidos), sin ningún texto ni nombre.

**E2.** Dado que ese mismo registro público en agregado ya existe
Cuando la persona externa de la segunda capa lo lee, fuera del producto, por decisión de gobierno
Entonces lee el mismo agregado ya disociado: el producto no construye ningún acceso nuevo para ella.
**Falta decidir**: quién es esa persona externa, cómo se le da acceso y cada cuánto revisa el registro; es una decisión de gobierno, no un requisito del producto (README de la épica, US-218).

### Negativos

**N1.** Dado el registro público en agregado, cuando alguien lo lee, entonces nunca ve el texto del testimonio bajado, el motivo completo tal como lo escribió quien reportó, ni el nombre de quien escribió o de quien reportó: sale por categoría y en números, nunca en contenido.

### Edge cases

- Un mes sin ninguna baja ni retención: el registro público muestra el agregado en cero, la sección no desaparece.
- Si el agregado se publica en Equipo, en Anonimato, o en ambos, es una pregunta abierta en las dos fichas (README de la épica).
- "Se revisa cada tanto" no es una cadencia: cada cuánto se revisa el registro no está decidido (README de la épica).

## US-219: Dar de baja a alguien del equipo

### Camino feliz

**E1.** Dado que Camila tiene el rol verificación activo
Cuando el Admin la da de baja en Equipo
Entonces su acceso se corta en el momento: ya no puede entrar a Verificaciones, ni con la sesión que tenía abierta.

**E2.** Dado que Camila fue dada de baja el 2026-08-21
Cuando alguien revisa el registro de acciones (US-216)
Entonces las constancias que aprobó o rechazó mientras estuvo activa siguen apareciendo con su autoría y su fecha: la baja no borra lo que hizo.

### Negativos

**N1.** Dado que Camila fue dada de baja y su sesión en el navegador seguía abierta, cuando intenta aprobar una nueva constancia con esa misma sesión, entonces no puede: el corte es en el momento de la baja, no en el próximo login.

### Edge cases

- Acceso revocado en medio de una operación (Camila a mitad de aprobar una constancia cuando el Admin la da de baja): qué pasa con esa acción a medio hacer no está decidido (README de la épica).
- Sesión abierta en otra pestaña o en otro dispositivo cuando se da la baja: se corta igual, no depende de cerrar sesión antes.
- Alguien que dejó el equipo vuelve más tarde: si el alta reactiva la cuenta vieja con su historial de acciones o crea una entidad nueva en el registro no está decidido (README de la épica).
