# US-210: Separar la cola de identidad docente

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: BO2-6

## Historia

Como quien verifica, quiero una cola de identidad docente separada de la de constancias, porque para el alumno verificarse es una señal y para el docente es el permiso de publicar una réplica con su nombre.

## Listo cuando

- La identidad docente se prueba contra el equipo docente que el catálogo tiene cargado para esa cátedra, en su propia cola; sin eso no se publica ninguna réplica.
- Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie.

## Dónde se resuelve

- [Verificaciones](../../screens/SC-032-verifications/README.md): la identidad docente tiene su propia cola, separada de las constancias; se prueba contra el equipo docente que el catálogo tiene cargado para esa cátedra.
- [Verificar](../../../../student/care-for-what-is-published/screens/SC-022-verify/README.md): el camino de identidad docente, con el aviso de que se compara contra lo que el catálogo ya sabe de esa cátedra.
- [Responder](../../../../reviewed/reply/screens/SC-020-respond/README.md): sin identidad verificada, en vez del campo de respuesta hay un aviso para ir primero a Verificar.

## Notas

se parte al planificar; par de US-178
