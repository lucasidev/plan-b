# US-168: Leer sin necesitar cuenta

> Los casos de [US-168](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Valentina nunca creó una cuenta en plan-b,
Cuando entra a la Ficha de cátedra de Análisis Matemático II, Cátedra Pérez, UNSTA (cabecera de gestión: "6 de cada 10 marcaron alguien fallando, 41 voces"),
Entonces lee la cabecera, las listas de frases por eje, la serie por período y los testimonios completos sin que en ningún momento se le pida iniciar sesión.

**E2.** Dado que Valentina compara instituciones en Dónde estudiarla,
Cuando abre la Ficha de carrera de cada oferta comparada,
Entonces las lee todas sin cuenta: ninguna pantalla de esa cadena de lectura le exige login.

## Negativos

**N1.** Dado que Silvia entra directamente a la Ficha de carrera de la carrera de su hija, sin cuenta, cuando la pantalla termina de cargar, entonces NO aparece ningún redirect ni modal a Ingresar antes de mostrarle la trayectoria y la cohorte cerrada: Ingresar solo aparece si ella misma dispara una acción con cuenta.

## Edge cases

- Una cátedra recién cargada con una sola voz, por ejemplo "Física I, Cátedra Domínguez, UNSTA" con F18 "Hay clases que no se dan" encogida de 100% a 20,7% con 1 voz (ADR-0075), se lee sin cuenta igual que una con 41 voces: el gate nunca depende de cuánta data hay detrás.
- El límite exacto entre "una pantalla de lectura con una acción adentro" (votar, reportar) y "una pantalla que pide cuenta" no está escrito: hoy el gate está en la acción puntual (reportar no pide cuenta, votar sí), nunca en toda la pantalla, pero dónde termina esa línea queda abierto. **Falta decidir**.
