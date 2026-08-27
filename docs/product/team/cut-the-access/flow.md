# Cortar los accesos: el flujo

> Reemplaza a la mitad de la fila BO-7 (Cuando la cola nos gana, y quién nos mira) que habla de quién audita al equipo, de la tabla de flujos del [mapa](../../map.md); el resto es el recorrido del Admin, que el mapa no dibujaba. Personas: Admin, el lector externo. Disparador: alguien se suma o se va del equipo; una acción sobre una cola que quedó registrada. Stories que cubre: US-215, US-216, US-217, US-218, US-219.

```mermaid
flowchart TD
  A([Alguien se suma al equipo]) --> B[Equipo: Admin da de alta la cuenta]
  B --> C[Asigna un rol: catálogo, curaduría de frases,<br/>moderación o verificación]
  C --> D{¿Choca con la exclusión de US-217,<br/>o es el Admin pidiéndose un rol operativo?}
  D -->|sí, moderación y verificación juntas, o autoasignación| E([Imposible: no auditado, US-217])
  D -->|no| F[Rol asignado]
  F --> I[Ve solo sus colas: ni por acceso directo a las demás, US-215]
  I --> J[Cada acción sobre una cola queda con autor y fecha, US-216]
  J --> K[El registro guarda referencias que un solo rol no puede unir]
  K --> L{Alguien se va del equipo}
  L --> M([El acceso se corta en el momento<br/>y su registro de acciones queda, US-219])
  K --> N{Quién revisa el registro, US-218}
  N -->|primera capa, construible| N1([Se publica en agregado: notas editoriales,<br/>ítems destilados y reclamos resueltos, por categoría, sin contenido])
  N -->|segunda capa, decisión de gobierno| N2([Una persona externa lee el registro<br/>ya disociado, nunca en bruto])
```

Pantalla: [Equipo](screens/SC-033-team/README.md).

## Salidas y errores

- **Asignar moderación y verificación a la misma persona es imposible**, no una regla que se pueda saltear con un permiso especial (US-217).
- **El Admin no puede darse a sí mismo un rol operativo** (catálogo, curaduría, moderación, verificación): solo administra accesos.
- **Ningún rol llega a una cola que no es la suya, ni por URL directa** (US-215): no es una cuestión de qué muestra el menú.
- **La baja de alguien del equipo corta el acceso en el momento**: el registro de lo que esa persona hizo no se borra con la baja (US-219).
- **El registro está armado para que ningún rol, actuando solo, pueda reconstruir un cruce**: es una propiedad de cómo se guardan las referencias, no una promesa de conducta.
- **La primera capa de US-218 es lo único que se construye ahora**: el agregado público, sin contenido. La segunda, la persona externa, lee y no opera, y la decide el gobierno del proyecto, no un requisito.

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se ve en Equipo el intento de asignar un rol que choca, si se deshabilita la opción o se explica por qué; qué pide el alta además del mail y el rol; qué pasa con una acción a medio hacer cuando a alguien se le corta el acceso en el momento.
