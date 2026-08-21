# US-178: Verificar identidad antes de responder

**Épica**: [Replicar](../README.md)
**Del mapa**: O7-8

## Historia

Como el docente, quiero probar que soy yo antes de responder, porque si cualquiera firma con mi nombre, mi réplica no vale nada.

## Listo cuando

- La réplica no se publica sin identidad docente o institucional verificada contra el catálogo; esa verificación vive en una cola separada de la de constancias de alumno, y para el docente verificar es permiso, no señal.

## Dónde se resuelve

- [Responder](../screens/SC-020-respond/README.md): sin identidad verificada, no hay campo de respuesta.
- [Verificar](../../care-for-what-is-published/screens/SC-022-verify/README.md): el camino de identidad docente, donde se prueba contra la cátedra.
- [Verificaciones](../../moderate-without-breaking-the-product/screens/SC-032-verifications/README.md): la cola donde Camila aprueba o rechaza esa identidad.
- [Registro](../../enter/screens/SC-026-sign-up/README.md): elegir "docente" abre el reclamo de identidad que después se prueba en Verificar.

## Notas

depende de US-210; par de US-210
