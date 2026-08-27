namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Child entity de <see cref="Item"/>: una de las respuestas posibles, con el texto literal que la
/// ficha repite cuando es la moda ("Casi nunca · 59 %"). El ctor es internal: solo el
/// <see cref="Item"/> las crea, que es lo que mantiene sus invariantes (valores y órdenes únicos,
/// a lo sumo una negativa) dentro del aggregate.
///
/// <para>
/// El <see cref="Value"/> es el que se persiste en la respuesta y NO se recicla: si una opción se
/// retira, su valor queda reservado para siempre, porque las reseñas viejas lo siguen apuntando.
/// </para>
/// </summary>
public sealed class ItemOption
{
    public const int MaxLabelLength = 120;

    public short Value { get; private set; }
    public short Order { get; private set; }
    public string Label { get; private set; } = null!;
    public OptionValence Valence { get; private set; }

    private ItemOption() { }

    internal ItemOption(short value, short order, string label, OptionValence valence)
    {
        Value = value;
        Order = order;
        Label = label.Trim();
        Valence = valence;
    }
}
