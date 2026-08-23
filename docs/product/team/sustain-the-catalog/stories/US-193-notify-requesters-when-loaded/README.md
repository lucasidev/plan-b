# US-193: Avisar a quienes esperaban al terminar

**Épica**: [Sostener el catálogo](../../README.md)
**Del mapa**: BO1-3

## Historia

Como quien carga el catálogo, quiero avisarle a los que esperaban cuando termino, porque si no se enteran, el pedido fue trabajo tirado de los dos lados.

## Listo cuando

- Al marcar una oferta como cargada sale el aviso a todos los que la pidieron.

## Dónde se resuelve

- [Pedidos](../../screens/SC-030-requests/README.md): "Marcar como cargada" dispara el aviso a todos los que la pidieron y saca la fila de la cola.
- [Avisos](../../../../notices/screens/SC-034-mail/README.md): el contenido del mail que llega a quien pidió, con el link a la ficha ya cargada.

## Notas

par de US-142
