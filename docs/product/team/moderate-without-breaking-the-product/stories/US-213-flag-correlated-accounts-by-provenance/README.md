# US-213: Alertar cuentas correlacionadas por procedencia

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: BO5-2

## Historia

Como quien modera, quiero que me avise cuando un grupo de cuentas correlacionadas reseña la misma cátedra, porque puede ser un centro organizando o el docente pidiéndoselo a sus alumnos, y eso destruye el corpus.

## Listo cuando

- La alarma mira la procedencia (fecha de alta, patrón idéntico, ausencia de trayectoria) y no el volumen: cuarenta personas con historia distinta no la disparan.
- Las cuentas marcadas no suman voces ni entran a ningún agregado de trayectoria.
- Los conteos se pueden congelar sin borrar nada.

## Dónde se resuelve

- [Reportes](../../screens/SC-031-reports/README.md): la alarma de cuentas correlacionadas mira la procedencia, no el volumen; marcarlas les saca la voz de cualquier agregado y permite congelar los conteos de la cátedra sin borrar nada.

## Notas

P1; tema del mapa: BO5 · Cuando el corpus está bajo ataque
