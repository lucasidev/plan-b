# Pedir una carrera: el flujo

> Reemplaza a la fila 02 (Ana busca la suya y no está) de la tabla de flujos del [mapa](../map.md). Personas: Ana; del otro lado, Sofía. Disparador: buscar una carrera o una facultad que no aparece. Stories que cubre: US-139, US-140, US-141, US-142, US-136, US-134, US-192, US-193, US-200, US-202, US-169.

```mermaid
flowchart TD
  A([Ana busca su carrera o su facultad]) --> B[Explorar / Buscar → Elegir dónde estudiar]
  B -->|no la cargamos todavía| C1[El vacío explicado: es nuestro, no de su facultad, US-139]
  B -->|cargada, sin voces| C2[La primera voz ya se publica,<br/>con sus voces y su encogimiento → Reseñar, US-136]
  B -->|cargada con voces, sin cabecera| C3[La cobertura a la vista: todavía no derivamos, US-134]
  C3 --> C3a([Se lee materia por materia])
  C1 --> D[Pedir: solo el mail, sin cuenta, US-140]
  D --> E[Mail con link para confirmar]
  E -->|confirma| F[El pedido cuenta: un mail por carrera, D03]
  E -->|no confirma| G([No entra a la cola])
  F --> H[La cola: pública, ordenada por pedidos confirmados,<br/>cuáles ya están, cuánto se tarda, US-141, US-200]
  H --> I[Sofía carga por pedidos → Sostener el catálogo, US-192]
  I --> J[Aviso por mail: la cargamos, link a la ficha<br/>que se lee sin cuenta, US-142, US-193]
  J --> K[Ficha de carrera]
  K -->|se registra| L([Institución y carrera precargadas:<br/>no se vuelven a preguntar, US-142, US-169])
```

Pantallas propias de esta épica: [Pedir](screens/SC-010-request/README.md) (D) y [La cola](screens/SC-009-queue/README.md) (H).

## Salidas y errores

- **El mail no confirma**: el pedido no entra a la cola, no cuenta como reclamo.
- **La carrera ya estaba cargada**: Explorar y Buscar ya la muestran, no hace falta pedirla.
- **Pedir dos veces con el mismo mail para la misma carrera cuenta una sola vez** (D03).
- **La fuente no existe o se contradice al cargar**: es problema de Sofía en Catálogo, que marca de dónde salió el dato (US-202, en [Sostener el catálogo](../sustain-the-catalog/flow.md)).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se ve el campo de Pedir cuando el nombre es ambiguo, texto libre o una lista de instituciones conocidas; qué dice exactamente La cola sobre cuánto se tarda; el copy de los tres estados del vacío en Explorar y en Buscar.
