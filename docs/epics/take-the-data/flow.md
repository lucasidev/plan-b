# Llevarse el dato: el flujo

> Reemplaza a la fila 07 de la tabla de flujos del [mapa](../../design/product-map.md) (Rocío se lleva el dato). Persona: Rocío. Disparador: entra a Explorar o a una Ficha de carrera y sigue el link a Método. Stories que cubre: O8-1, O8-2, O8-3, O8-4, O8-5, O8-6, O8-7, O8-8, O1-4.

```mermaid
flowchart TD
  A([Explorar o Ficha de carrera]) --> B[Método: la fórmula del encogimiento tal cual<br/>y cómo se suman las voces, O1-4, O8-3]
  B --> C[El catálogo de frases entero, con sujeto, eje<br/>y cuál es destilada, O8-8]
  C --> D[Los sesgos declarados: de quienes reseñaron,<br/>la duración real, la co-cursada, O8-2]
  D --> E[Qué no cubrimos: carreras cargadas, en cola y pedidas<br/>cobertura por plan, cuentas afuera por inconsistencia, O8-2]
  E --> F[Cuánto se bajó del corpus y por qué, por categoría<br/>sin contenido, O8-6]
  F --> G[La postura sin acuerdos con instituciones, O8-5]
  G --> H{Descargar sin cuenta, O8-1}
  H --> I([Tabla 1: frase, sujeto, período, voces, eje])
  H --> J([Tabla 2: trayectoria por carrera-institución y cohorte<br/>por materia y período, por par y período])
  I --> K([Lo discute afuera])
  J --> K
  A --> L[En la ficha: el texto retirado se ve como retirado<br/>con su categoría, sin contenido, O8-7]
  L --> M([Ninguna causa afirmada, O8-4])
```

## Salidas y errores

- **Lo que se descarga es lo que se publica**, ni más fino ni más grueso: nunca nombre, cuenta ni perfil, y los testimonios no se exportan en bloque.
- **Cuentas afuera por inconsistencia**: se publica cuántas, y no entran a ningún agregado.
- **El texto retirado** se ve como retirado con su categoría; sus frases siguen contando (O8-6, O8-7).
- **Ninguna ficha afirma una causa** (O8-4); la descarga es sin cuenta y sin registro (THESIS, "Posición").

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Cómo se organiza Método en una pantalla o varias; el formato exacto de las columnas del CSV; con qué periodicidad se regenera el crudo.
