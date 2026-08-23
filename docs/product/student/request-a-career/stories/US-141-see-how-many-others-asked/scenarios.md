# US-141: Ver cuántos más la pidieron

> Los casos de [US-141](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Rocío no tiene cuenta en plan-b,
Cuando entra a La cola,
Entonces ve la lista completa de carreras pedidas sin que se le pida iniciar sesión en ningún momento.

**E2.** Dado que las carreras pedidas tienen 34, 23, 21, 19, 18, 17, 16, 15, 9 y 4 pedidos confirmados respectivamente: "Contador Público, Siglo 21"; "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán"; "Profesorado en Educación Física, Siglo 21"; "Ingeniería Industrial, UTN Facultad Regional Tucumán"; "Licenciatura en Enfermería, UNSTA"; "Contador Público, UNSTA"; "Tecnicatura en Higiene y Seguridad, Siglo 21"; "Profesorado en Matemática, UNT"; "Abogacía, USPT"; "Tecnicatura en Programación, Siglo 21",
Cuando Ana abre La cola,
Entonces las ve en ese mismo orden, de mayor a menor cantidad de pedidos confirmados, con "Contador Público, Siglo 21" primera y "Tecnicatura en Programación, Siglo 21" última.

## Negativos

**N1.** Dado que Ana pidió "Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán", cuando cualquiera (con o sin cuenta) mira La cola, entonces NO ve el mail ana.paez@gmail.com ni ningún otro dato de quién pidió cada carrera: solo el conteo total de 23.

**N2.** Dado que "Contador Público, Siglo 21" lleva 34 pedidos confirmados, cuando alguien mira su fila en La cola, entonces NO hay ninguna fecha de entrega prometida para esa carrera puntual: solo el promedio general de cuánto se tarda.

## Edge cases

- El primer día, sin pedidos todavía, La cola no se muestra vacía sin contexto: explica el criterio propio con el que Sofía carga mientras no hay demanda (US-203). **Falta decidir**: el copy exacto de ese criterio de arranque.
- Una carrera pasa de pedida a cargada (por ejemplo, "Licenciatura en Psicología, UNSTA" con 41 pedidos confirmados): deja de mostrar el conteo y muestra "Ya está: ver ficha" en su lugar.
- Dos carreras empatadas en pedidos confirmados: ninguna fuente fija cuál va primero. **Falta decidir**.
