# US-208: No cruzar verificación con lo aportado

**Épica**: [Moderar sin romper el producto](../README.md)
**Del mapa**: BO2-4

## Historia

Como quien verifica, quiero no poder ver qué reseñó la persona cuya constancia verifico, porque si puedo cruzarlo, el anonimato es una promesa y no un mecanismo.

## Listo cuando

- Desde la cola de constancias no hay ningún camino a los aportes de esa cuenta, ni por acceso directo.
- La cola de identidad docente es otra y no cae bajo esta regla: verificar al docente es atarlo a la cátedra sobre la que se publica.

## Dónde se resuelve

- [Verificaciones](../screens/SC-032-verifications/README.md): no hay ningún link desde la cola de constancias a las reseñas o votos de esa cuenta, ni por URL directa.
- [Verificar](../../care-for-what-is-published/screens/SC-022-verify/README.md): el aviso dice que subir la constancia nunca abre un camino hacia los aportes de la cuenta.
