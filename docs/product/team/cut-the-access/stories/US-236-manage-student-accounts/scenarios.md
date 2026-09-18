# US-236: Gestionar el acceso de las cuentas de alumnos

**E1.** Dada una cuenta de alumno activa con perfil académico, cuando el administrador busca su email, ve esa cuenta con su carrera y universidad, sin sus reseñas ni comentarios.

**E2.** Dada esa cuenta con una sesión abierta, cuando el administrador suspende su acceso con un motivo, las siguientes solicitudes autenticadas y la renovación de sesión se rechazan. El perfil y los aportes se conservan.

**E3.** Dada una cuenta suspendida, cuando el administrador reactiva su acceso, puede volver a iniciar sesión y conserva el perfil anterior. Si su email estaba pendiente, todavía debe verificarlo.

**E4.** Dada una cuenta del equipo o una cuenta dada de baja, cuando alguien intenta suspenderla o reactivarla desde los endpoints de alumnos, la operación se rechaza.

**E5.** Dada una persona sin sesión o con rol member, cuando intenta listar o administrar cuentas de alumnos por HTTP, recibe 401 o 403 según corresponda.

**E6.** Dado un motivo vacío o de más de 500 caracteres, cuando el administrador intenta suspender una cuenta, recibe un error de validación y la cuenta conserva su estado.

**E7.** Dadas más de 25 cuentas, cuando el administrador pasa a la página siguiente, conserva la búsqueda y el filtro de estado. Buscar `%` se interpreta como texto literal.
