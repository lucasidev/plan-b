namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Child entity de <see cref="Instrument"/>: una frase del catálogo ofrecida en esta versión del
/// cuestionario, con el orden en que se pregunta. El ctor es internal: solo el instrumento las crea,
/// que es lo que mantiene sus invariantes (sin frases ni órdenes repetidos) dentro del aggregate.
///
/// <para>
/// No lleva marca de obligatorio: saltear siempre vale (ADR-0082). Tampoco lleva condición: las
/// frases condicionales no existen todavía en el catálogo vigente.
/// </para>
/// </summary>
public sealed class InstrumentItem
{
    public ItemId ItemId { get; private set; }
    public short Order { get; private set; }

    private InstrumentItem() { }

    internal InstrumentItem(ItemId itemId, short order)
    {
        ItemId = itemId;
        Order = order;
    }
}
