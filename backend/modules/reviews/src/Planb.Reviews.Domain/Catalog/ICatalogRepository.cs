namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Write-side del catálogo del instrumento (ADR-0082): los ítems y sus versiones. Los reads que
/// alimentan la pantalla Reseñar y el Método público van por query service con Dapper; este repo es
/// solo para cargar los aggregates a mutar. El SaveChanges lo hace el unit of work del módulo.
/// </summary>
public interface ICatalogRepository
{
    Task AddItemAsync(Item item, CancellationToken ct = default);

    Task<Item?> GetItemByIdAsync(ItemId id, CancellationToken ct = default);

    /// <summary>Por su identidad semántica. Es como se lo busca al curar y al cargar el catálogo.</summary>
    Task<Item?> GetItemByCodeAsync(string code, CancellationToken ct = default);

    /// <summary>True si otro ítem ya usa ese código. Refleja el UNIQUE de DB.</summary>
    Task<bool> ItemCodeExistsAsync(string code, ItemId? excludeId, CancellationToken ct = default);

    /// <summary>
    /// Los ítems pedidos, por id. La usa la publicación de un instrumento para validar de una que
    /// todos existan y ninguno esté retirado, sin una consulta por ítem.
    /// </summary>
    Task<IReadOnlyList<Item>> GetItemsByIdsAsync(
        IReadOnlyCollection<ItemId> ids,
        CancellationToken ct = default);

    /// <summary>
    /// Los valores de opción de un ítem que ya tienen respuestas guardadas. Es lo que
    /// <see cref="Item.ReplaceOptions"/> necesita para no dejar huérfana una respuesta vieja.
    /// </summary>
    Task<IReadOnlySet<short>> GetAnsweredOptionValuesAsync(ItemId itemId, CancellationToken ct = default);

    Task AddInstrumentAsync(Instrument instrument, CancellationToken ct = default);

    /// <summary>
    /// La versión vigente de un cuestionario, con sus ítems. Es la que la pantalla Reseñar ofrece y
    /// a la que queda atada cada reseña nueva. Null si ese código todavía no se publicó.
    /// </summary>
    Task<Instrument?> GetCurrentInstrumentAsync(string code, CancellationToken ct = default);

    /// <summary>
    /// Un cuestionario por id, con sus ítems, aunque ya no sea el vigente. Null si no existe.
    ///
    /// <para>
    /// Lo pide editar una reseña (US-165): se valida contra el cuestionario con el que se
    /// respondió y no contra el de hoy, porque si el catálogo cambió desde entonces, corregir una
    /// respuesta vieja no puede exigirle al autor que conteste preguntas que no le hicieron.
    /// </para>
    /// </summary>
    Task<Instrument?> GetInstrumentByIdAsync(InstrumentId id, CancellationToken ct = default);
}
