/**
 * Copy compartido del producto. Single source of truth para strings que se
 * repiten entre vistas, así no driftean. US-059-f.
 */

/**
 * Disclaimer legal de no-afiliación, genérico (multi-universidad): el producto
 * no está afiliado oficialmente a ninguna universidad. No nombrar UNSTA: que el
 * canvas lo tenga hardcodeado no lo vuelve spec, el producto es multi-uni.
 */
export const INDEPENDENT_PROJECT_DISCLAIMER = 'no afiliado oficialmente con ninguna universidad';

/**
 * Lo que mostramos cuando una métrica todavía no tiene reseñas que la sustenten.
 *
 * Existía en cuatro versiones a la vez ("s/d", "sin dato", "sin datos", "sin reseñas todavía"), y
 * la abreviada era la más usada justo en las fichas de materia y docente, que es donde más caro
 * sale: "s/d" no está explicado en ninguna parte de la app.
 *
 * Ojo con la alternativa de mostrar 0: "0.0/5" no es dato faltante, es "facilísima", y "0%" es
 * "no la recomienda nadie". Un cero inventado miente más que una abreviatura.
 */
export const NO_DATA_YET = 'sin datos';
