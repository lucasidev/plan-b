# US-215: Cada rol ve solo sus colas

**Épica**: [Cortar los accesos](../../README.md)
**Del mapa**: BO3-1

## Historia

Como quien administra, quiero que cada rol vea solo sus colas, porque catálogo no necesita ver una constancia con nombre, y si puede algún día la mira.

## Listo cuando

- El rol de catálogo no llega a reportes ni verificaciones, ni por acceso directo.

## Dónde se resuelve

- [Equipo](../../screens/SC-033-team/README.md): cada rol entra solo a sus colas (catálogo a Pedidos, Catálogo, Correcciones y Frases; moderación a Reportes; verificación a Verificaciones); ninguno llega a la de otro, ni por URL directa.
- [Pedidos](../../../sustain-the-catalog/screens/SC-030-requests/README.md): el rol catálogo no llega a las colas de moderación ni de verificación, ni por acceso directo.
