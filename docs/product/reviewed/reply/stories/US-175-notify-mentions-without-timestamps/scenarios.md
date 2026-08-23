# US-175: Avisar al docente que lo nombraron

> Los casos de [US-175](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Claudia Fernández tiene identidad docente verificada sobre Cátedra Pérez, y que en el último período se marcaron 5 frases nuevas sobre su cátedra, entre ellas F18 (ahora en 12 de 40 voces, 18,1%, ADR-0075)
Cuando se cumple la cadencia del resumen periódico
Entonces a Claudia le llega un mail que dice cuántas frases nuevas se marcaron sobre su cátedra, sin ninguna fecha ni hora de cuándo se aportó cada una.

## Negativos

**N1.** Dado que Prof. Paredes nunca pidió ni tiene identidad docente verificada
Cuando se marcan frases nuevas sobre Cátedra Ibáñez
Entonces no le llega ningún resumen: el aviso sale solo para quien tiene identidad verificada.

## Edge cases

- El período cierra sin ninguna frase nueva marcada sobre esa cátedra: la story no dice si igual se manda un mail sin novedades o directamente no se manda. **Falta decidir**.
- La cadencia exacta del resumen (semanal, mensual u otra) no está fijada. **Falta decidir** (abierto en la ficha de pantalla de Avisos).
- Alguien compara dos resúmenes consecutivos tratando de inferir cuándo se escribió cada testimonio: el mail nunca lo permite porque no trae fecha ni hora por reseña.
