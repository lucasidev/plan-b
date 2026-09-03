using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Child entity de <see cref="Review"/>: la opción que alguien eligió para una frase. El ctor es
/// internal: solo la reseña las crea, que es lo que impide dos respuestas a la misma frase.
///
/// <para>
/// <b>Saltear no deja fila.</b> Una frase sin respuesta simplemente no está acá, y por eso no cuenta
/// en ningún denominador (ADR-0082): el denominador de una frase son las reseñas que la respondieron,
/// no las que existen. Guardar un "no dijo" explícito sería la misma información con una fila de
/// más, y abriría la puerta a contarlo como si fuera una respuesta.
/// </para>
/// </summary>
public sealed class ItemAnswer
{
    public ItemId ItemId { get; private set; }

    /// <summary>
    /// El <c>Value</c> de la opción elegida, no su texto: la etiqueta puede afinarse después sin
    /// tocar lo respondido, que es lo que mantiene comparable la serie (ADR-0082).
    /// </summary>
    public short OptionValue { get; private set; }

    private ItemAnswer() { }

    internal ItemAnswer(ItemId itemId, short optionValue)
    {
        ItemId = itemId;
        OptionValue = optionValue;
    }
}
