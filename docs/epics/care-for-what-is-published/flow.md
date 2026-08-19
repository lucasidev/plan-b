# Cuidar lo publicado: el flujo

> No reemplaza ninguna fila del mapa: el mapa dibuja Votar y Corregir como "acciones inline", sin fila de flujo propia. Personas: Matías (vota), quien vuelve (corrige), quien lee (los testimonios), quien ya aportó (se verifica). Disparador: leer una ficha con testimonios o con un dato duro mal cargado. Stories que cubre: T1-1, T1-2, T1-3 (y lo que tocan del otro lado: BO1-4, BO2-3, BO2-4, BO4-4).

```mermaid
flowchart TD
  A([Leyendo una ficha con voces]) --> B[Testimonios debajo de las frases,<br/>ordenados por votos: se leen en Elegir dónde estudiar]
  B --> C{A mí también me pasó}
  C -->|sin cuenta| G[Ingresar / Registro, vuelve a la ficha]
  C -->|con cuenta| C1([Suma una voz a las frases de esa reseña y reordena, T1-1])
  A --> D{Un dato duro está mal}
  D -->|sin cuenta| G
  D -->|con cuenta| D1[La fila se vuelve editable ahí mismo,<br/>sin aporte previo, D07, T1-2]
  D1 --> D2[[Correcciones: valor viejo y nuevo,<br/>se contrasta contra la fuente, BO1-4]]
  D2 --> D3([La ficha cambia para todos, sin votación])
  A --> E{Quiere que lo suyo pese más}
  E -->|sí| E1[Verificar: subir la constancia,<br/>opcional y tardío, T1-3]
  E1 --> E2[[Verificaciones: ve lo mínimo,<br/>destruye el documento al resolver, sin camino a los aportes, BO2-3, BO2-4]]
  E2 -->|aprobada| E3([La señal viaja con lo aportado,<br/>se ve en la ficha: las voces se cuentan igual])
  E2 -->|rechazada| E4([Motivo, puede volver a intentar sin quedar marcado, BO4-4])
  G --> B
```

## Salidas y errores

- **Sin cuenta**: votar, corregir y verificarse la piden; leer los testimonios y reportarlos no.
- **La corrección no cambia nada hasta contrastarse contra la fuente** (BO1-4): después cambia para todos, sin votación.
- **La constancia se destruye al resolver** (BO2-3) y esa cola no tiene camino a los aportes de la misma cuenta (BO2-4).
- **Verificarse no mueve ninguna proporción**: las voces se cuentan igual, verificadas o no (T1-3).
- **Una constancia adulterada se rechaza con motivo**, y quien la subió puede volver a intentarlo sin quedar marcado (BO4-4).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se ve la señal de verificado sin identificar a nadie; si el voto se puede retirar una vez puesto; qué datos duros son editables inline y cuáles quedan reservados al catálogo.
