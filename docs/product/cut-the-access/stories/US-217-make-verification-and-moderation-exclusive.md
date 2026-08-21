# US-217: Verificación y moderación son roles excluyentes

**Épica**: [Cortar los accesos](../README.md)
**Del mapa**: BO3-3

## Historia

Como quien administra, quiero que verificación y moderación no puedan vivir en la misma persona, porque quien ve un nombre real a las 14:32 y la cola de reportes filtrada por esa carrera a las 14:40 no necesita ningún camino en la pantalla para cruzarlos.

## Listo cuando

- Asignar el rol de verificación a quien tiene el de moderación (o al revés) es imposible, no auditado.
- El registro guarda referencias que un solo rol no puede unir, y el Admin no se puede auto-asignar roles operativos.

## Dónde se resuelve

- [Equipo](../screens/SC-033-team/README.md): la propia pantalla hace imposible asignar moderación y verificación a la misma persona, o que el Admin se pida un rol operativo; no es algo que se audite después.
- [Reportes](../../moderate-without-breaking-the-product/screens/SC-031-reports/README.md): quien tiene el rol de verificación no puede tener también este.
- [Verificaciones](../../moderate-without-breaking-the-product/screens/SC-032-verifications/README.md): quien tiene este rol no puede tener también el de moderación.

## Notas

equipo mínimo de cuatro (D09, [registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md))
