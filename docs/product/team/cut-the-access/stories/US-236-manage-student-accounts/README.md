# US-236: Gestionar el acceso de las cuentas de alumnos

**Épica**: [Cortar los accesos](../../README.md)
**Del mapa**: ninguno (sale de la gestión de incidencias de acceso que el backoffice ya necesita)

## Historia

Como quien administra, quiero encontrar una cuenta de alumno, consultar su estado y gestionar su acceso, porque necesito resolver incidencias sin acceder a sus aportes.

## Listo cuando

- Alumnos permite buscar por email, filtrar por estado y recorrer una lista paginada con los datos de cuenta y perfil necesarios para identificarla, sin mostrar aportes ni credenciales.
- Suspender guarda responsable y motivo, y corta el inicio, la renovación y el uso de sesiones ya emitidas; reactivar permite iniciar una sesión nueva, sin rehabilitar los tokens anteriores ni saltear la verificación pendiente de email. Ambas acciones conservan el perfil y los aportes.
- Solamente quien administra puede operar cuentas de alumnos vigentes: quedan afuera las cuentas del equipo, las dadas de baja y la cuenta propia, incluso si se intenta acceder directo al endpoint.

## Dónde se resuelve

- **Alumnos** (`/admin/users`): busca, filtra y pagina cuentas, y permite suspender o reactivar el acceso. Su ficha `SC-NNN` queda pendiente.

## Notas

Suspender acceso es reversible y conserva perfil y aportes; la baja con anonimización sigue siendo una operación distinta. Los [escenarios](scenarios.md) fijan los límites de autorización, privacidad y paginación.
