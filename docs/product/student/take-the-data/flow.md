# Llevarse el dato: el flujo

> Reemplaza a la fila 07 de la tabla de flujos del [mapa](../../map.md) (Rocío se lleva el dato). Persona: Rocío. Disparador: entra a Explorar o a una Ficha de carrera y sigue el link a Método. Stories que cubre: US-180, US-182, US-183, US-184, US-185, US-181, US-186, US-187, US-130.

```mermaid
flowchart TD
  A([Explorar o Ficha de carrera]) --> B[Método: la fórmula del encogimiento tal cual<br/>y cómo se suman las voces, US-130, US-183]
  B --> C[El catálogo de frases entero, con sujeto, eje<br/>y cuál es destilada, US-187]
  C --> D[Los sesgos declarados: de quienes reseñaron,<br/>la duración real, la co-cursada, US-182]
  D --> E[Qué no cubrimos: carreras cargadas, en cola y pedidas<br/>cobertura por plan, cuentas afuera por inconsistencia, US-182]
  E --> F[Cuánto se bajó del corpus y por qué, por categoría<br/>sin contenido, US-181]
  F --> G[La postura sin acuerdos con instituciones, US-185]
  G --> H{Descargar sin cuenta, US-180}
  H --> I([Tabla 1: frase, sujeto, período, voces, eje])
  H --> J([Tabla 2: trayectoria por carrera-institución y cohorte<br/>por materia y período, por par y período])
  I --> K([Lo discute afuera])
  J --> K
  A --> L[En la ficha: el texto retirado se ve como retirado<br/>con su categoría, sin contenido, US-186]
  L --> M([Ninguna causa afirmada, US-184])
```

De B a G es una sola pantalla hoy: [Método](screens/SC-021-method/README.md) (si se parte en varias todavía está abierto, ver su ficha).

## Salidas y errores

- **Lo que se descarga es lo que se publica**, ni más fino ni más grueso: nunca nombre, cuenta ni perfil, y los testimonios no se exportan en bloque.
- **Cuentas afuera por inconsistencia**: se publica cuántas, y no entran a ningún agregado.
- **El texto retirado** se ve como retirado con su categoría; sus frases siguen contando (US-181, US-186).
- **Ninguna ficha afirma una causa** (US-184); la descarga es sin cuenta y sin registro (THESIS, "Posición").

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se organiza Método en una pantalla o varias; el formato exacto de las columnas del CSV; con qué periodicidad se regenera el crudo.
