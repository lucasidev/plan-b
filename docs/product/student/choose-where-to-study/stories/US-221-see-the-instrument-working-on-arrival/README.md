# US-221: Entender qué es esto viendo una ficha real

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: ninguno (el mapa define la pantalla, ninguna story la pedía)

## Historia

Como quien lee, quiero entender qué es esto viendo un dato real y no una explicación, porque llegué desde un link, no sé si creerle a otro sitio más, y un texto que se presenta no me demuestra nada.

## Listo cuando

- La entrada muestra una ficha real con sus voces, no un ejemplo inventado ni un número de muestra.
- La ficha de la muestra sale al azar entre las que ya pasaron el piso de publicación: no se elige por tener el número más alto, ni el más bajo, ni por institución.
- Se dice qué es plan-b sin vocabulario de producto ni de tesis, y desde ahí se llega a explorar, a buscar y al método.

## Dónde se resuelve

- [Inicio](../../screens/SC-004-home/README.md): los cuatro bloques (qué es, la entrada a Explorar y Buscar, la muestra honesta y el método al alcance).

## Notas

Es la story que faltaba: [Inicio](../../screens/SC-004-home/README.md) estaba diseñada desde el [mapa](../../../../map.md) ("la vitrina: qué es plan-b y la puerta a Explorar y Buscar") y ninguna story la pedía, así que la sostenía sólo una garantía transversal ([US-171](../../../../guarantees/README.md#stories)), que vale para las 34 pantallas y no justifica ninguna.

**Por qué al azar entre las que pasaron el piso**: elegir la de más voces es un destacado disfrazado, y elegir cualquiera al azar entre todas puede caer en una cátedra que todavía está juntando sus primeras reseñas, sin nada que mostrar. El piso de publicación ya existe para las cátedras ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)): reusarlo acá resuelve la tensión con [US-171](../../../../guarantees/README.md#stories) sin inventar un mecanismo nuevo.
