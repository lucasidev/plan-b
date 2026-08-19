# Elegir dónde estudiar: el flujo

> Reemplaza a las filas 01 (Valentina tiene que elegir en dos meses) y 11 (Buscar, cuando te recomiendan una persona) de la tabla de flujos del [mapa](../../design/product-map.md). Personas: Valentina, Silvia, quien lee. Disparador: un link, un buscador, una recomendación, o Inicio. Stories que cubre: O1-1 a O1-8, T1-4, T2-3, T3-2, T3-6, O2-1, O6-1, O6-4.

```mermaid
flowchart TD
  A([Llega por un link, un buscador o Inicio: sin cuenta, O6-1]) --> B[Explorar: dos lentes, carreras y universidades]
  A --> S[Buscar: materia, carrera, docente o institución en una sola búsqueda, O1-6]
  S -->|el nombre de un docente| S1[Su cátedra: un docente no es una ficha, la cátedra sí]
  S -->|no está| S2[Buscar explica por qué: no la cargamos / cargada sin voces / todavía no derivamos, O2-1]
  S2 --> S3[Pedir, opcional → Pedir una carrera]
  S1 --> E
  B --> C[Ficha de carrera en una institución]
  C -->|la cobertura pasó la mitad de las materias canónicas| C1[Cabecera: dos proporciones con voces y encogimiento, O1-3, O1-5]
  C -->|todavía no| C2[Sin cabecera: la cobertura a la vista, 22 de 40 materias con voces;<br/>las frases derivadas dicen en cuántas materias aparecen, O1-8]
  C -->|sin voces| C3[La ficha vacía dice por qué y que la primera voz ya se publica, T2-3]
  C1 --> D[Listas de frases por eje con voces;<br/>trayectoria: nominal, real, brecha y la cohorte cerrada con su no dijo, O1-1, O1-7]
  C2 --> D2[Leer materia por materia]
  D --> E[Ficha de materia / Ficha de cátedra: frases, serie;<br/>los testimonios debajo, ordenados por votos, T1-4;<br/>el período de lo que la sostiene y el aviso si lo último es viejo, T3-2]
  D2 --> E
  E -->|una frase pesa mucho acá y poco en la carrera| E1[La ficha dice de qué voces está hecha: la carrera suma cursadas, no promedia, T3-6]
  D --> F[Dónde estudiarla: la misma carrera canónica lado a lado, dato por dato,<br/>sin compuesto, sin ganador, sin ordenar por valor, O1-2]
  F -->|quiere ordenar| F2[Método → el CSV, Llevarse el dato]
  D --> G[Método: la fórmula, el catálogo de frases con sujeto y eje, los sesgos, O1-4]
  E -->|quiere aportar| H[Ingresar / Registro → Reseñar]
  C3 -->|es el primero| H
```

## Salidas y errores

- **Lo que busca no está cargado** (O2-1): la ficha no existe y no se inventa; Buscar y Explorar explican el vacío y ofrecen Pedir. Sigue en [Pedir una carrera](../request-a-career/flow.md).
- **Cargada y sin voces** (T2-3): la ficha existe vacía, dice que la primera voz ya se publica con sus voces y su encogimiento, sin escalones.
- **Cargada con voces y sin cabecera** (O1-8): se lee materia por materia; nunca un cero ni una cabecera armada con tres materias.
- **Lo último es viejo** (T3-2): la ficha lo avisa; los testimonios muestran su período.
- **Quiere ordenar la comparación**: no se ordena por valor en pantalla; baja el CSV (O1-2, O8-1).
- **Nada de esto pide cuenta** (O6-1); nada está destacado ni patrocinado (O6-4); ninguna ficha afirma una causa (O8-4).

## Lo que el flujo no dibuja y la ficha de la pantalla decide

Qué lentes y qué orden ofrece Explorar; cómo se lee la trayectoria sin vocabulario (O1-7); el layout de Dónde estudiarla en celular con muchas ofertas; qué muestra la Ficha de institución además de la serie y la comparación frase por frase (O7-3, O7-7, en [Replicar](../reply/README.md)).
