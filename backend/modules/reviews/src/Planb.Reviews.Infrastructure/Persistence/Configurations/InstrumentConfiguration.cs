using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class InstrumentConfiguration : IEntityTypeConfiguration<Instrument>
{
    public void Configure(EntityTypeBuilder<Instrument> builder)
    {
        builder.ToTable("instruments");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new InstrumentId(value));

        builder.Property(i => i.Code)
            .HasColumnName("code")
            .HasMaxLength(Instrument.MaxCodeLength)
            .IsRequired();

        builder.Property(i => i.Version)
            .HasColumnName("version")
            .IsRequired();

        builder.Property(i => i.ValidFrom)
            .HasColumnName("valid_from")
            .IsRequired();

        // Null mientras es la versión vigente (ver docstring de Instrument). IsCurrent es una
        // proyección calculada (ValidUntil is null) y no se mapea: no tiene setter ni backing field,
        // así que la convención de EF ya la excluye del modelo (mismo caso que ChairMember.IsCurrent).
        builder.Property(i => i.ValidUntil)
            .HasColumnName("valid_until");

        // UNIQUE(code, version): dos publicaciones de la misma versión del mismo cuestionario no
        // pueden coexistir. Cuál de las dos versiones de un código está vigente lo decide ValidUntil,
        // no este índice.
        builder.HasIndex(i => new { i.Code, i.Version })
            .IsUnique()
            .HasDatabaseName("ux_instruments_code_version");

        builder.Ignore(i => i.DomainEvents);

        // Los ítems ofrecidos en esta versión, tabla hija. Clave compuesta (instrument_id, item_id):
        // InstrumentErrors.DuplicateItem es justamente que un ítem no se repita en el mismo instrumento.
        builder.OwnsMany(i => i.Items, ii =>
        {
            ii.ToTable("instrument_items");

            ii.Property<InstrumentId>("instrument_id")
                .HasColumnName("instrument_id")
                .HasConversion(id => id.Value, value => new InstrumentId(value));

            ii.WithOwner().HasForeignKey("instrument_id");

            // Ref cross-aggregate hacia Item, Guid plano vía el converter del VO (sin FK Postgres,
            // ADR-0017: Item e Instrument son aggregates distintos aunque compartan schema).
            ii.Property(item => item.ItemId)
                .HasColumnName("item_id")
                .HasConversion(id => id.Value, value => new ItemId(value));

            ii.HasKey("instrument_id", "ItemId");

            ii.Property(item => item.Order)
                .HasColumnName("order")
                .IsRequired();
        });

        builder.Navigation(i => i.Items).AutoInclude();
    }
}
