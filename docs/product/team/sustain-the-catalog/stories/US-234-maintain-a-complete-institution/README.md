# US-234: Cargar una institución completa

**Épica**: [Sostener el catálogo](../../README.md)
**Del mapa**: BO1-1

## Historia

Como Sofía, quiero cargar y mantener una institución completa desde Catálogo, porque una ficha que depende del seed o mezcla datos de otra institución no se puede sostener.

## Listo cuando

- Puedo crear y editar su identidad y ubicación: nombre, slug, dominios institucionales, URL oficial, logo, dirección y localidad resuelta por Georef.
- Puedo crear y editar sus unidades académicas y vincular cada oferta solo a una unidad de la misma institución; la pantalla deriva cuántas unidades, carreras y planes tiene sin guardar esos conteos a mano.
- Puedo cargar y corregir sus afirmaciones oficiales con valor, fuente, fecha y estado; una corrección conserva la afirmación anterior, y un guardado inválido no pisa el último dato válido.

## Dónde se resuelve

- [Catálogo](../../screens/SC-027-catalog/README.md): la edición de una institución concentra identidad, ubicación, unidades académicas, conteos derivados y afirmaciones oficiales.

## Notas

El logo se carga como PNG acotado y queda asociado al ID estable de la institución, según
[ADR-0098](../../../../../decisions/0098-small-institution-logos-are-stored-with-the-catalog.md).

Las afirmaciones oficiales siguen el modelo de [ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md). La lectura pública de identidad y ubicación pertenece a [US-235](../../../../student/choose-where-to-study/stories/US-235-see-who-and-where-the-institution-is/README.md); esta story es el trabajo de Sofía que mantiene su fuente.
