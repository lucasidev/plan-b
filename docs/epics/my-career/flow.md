# Mi carrera: el flujo

> Reemplaza a la fila 04 de la tabla de flujos del [mapa](../../design/product-map.md) (Lucía no quiere repetir el error). Persona: Lucía; también Matías y Diego, que no marcan ningún plan (O6-3). Disparador: viene de la Ficha de carrera con la co-cursada pública a la vista, o abre Mi carrera para decidir el próximo cuatrimestre. Stories que cubre: O3-1, O3-2, O3-3, O6-3, BO5-1.

```mermaid
flowchart TD
  A([Ficha de carrera: co-cursada pública<br/>por par y período, con sus voces, O3-1]) --> B{Entra con cuenta a Mi carrera}
  B -->|Matías o Diego: no marcan ningún plan| P([Todo sigue funcionando igual, sin plan, O6-3])
  B -->|Lucía, para no repetir el error| C[Mi carrera: el plan con correlativas]
  C --> D[Lo que reseñó con cómo terminó:<br/>viene marcado solo, es un hecho]
  C --> E[Lo que marca que le falta o considera:<br/>preferencia privada, no se recaba ni se publica, ADR-0069]
  D --> F[Co-cursada filtrada a lo que todavía puede cursar, O3-2]
  E --> F
  F --> G([El producto no arma horarios: lo anota en papel<br/>y vuelve a marcar en el plan lo que va a cursar, O3-3])
  C -.->|la facultad reformó el plan| I[Los dos planes coexisten con su año:<br/>la reseña queda pegada al período y a la materia canónica, BO5-1]
```

## Salidas y errores

- **Sin plan marcado, todo sigue igual** (O6-3): reseñar, leer y votar no dependen de haber marcado nada en Mi carrera.
- **Sin cuenta no se llega a Mi carrera**; la co-cursada pública de la Ficha de carrera sí se lee sin cuenta (el gate está en la acción, no en la lectura).
- **La facultad reformó el plan**: los dos planes coexisten con su año, y la reseña sigue pegada al período y a la materia canónica, no a la fila de un plan en particular (BO5-1).
- **Lo marcado no es un hecho**: se puede cambiar en cualquier momento sin que quede rastro público ni entre a ningún agregado.
- **Una oferta que ya tenés marcada cambia** (una correlativa que se corrige, por ejemplo): te enterás de qué cambió (BO4-2), aunque este flujo no dibuja ese aviso.

## Lo que el flujo no dibuja y la ficha de la pantalla decide

- Cuántos pares de co-cursada entran en pantalla y cómo se ordenan cuando son muchos.
- Qué pregunta Empezar la primera vez, además de por dónde vas.
- Qué pasa en pantalla con la preferencia marcada cuando el plan se reforma.
- Cómo se distingue visualmente lo reseñado (hecho) de lo marcado (preferencia) dentro del mismo plan.
