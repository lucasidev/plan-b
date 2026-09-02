using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable("items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ItemId(value));

        builder.Property(i => i.Code)
            .HasColumnName("code")
            .HasMaxLength(Item.MaxCodeLength)
            .IsRequired();

        builder.Property(i => i.Text)
            .HasColumnName("text")
            .HasMaxLength(Item.MaxTextLength)
            .IsRequired();

        builder.Property(i => i.Help)
            .HasColumnName("help")
            .HasMaxLength(Item.MaxHelpLength);

        builder.Property(i => i.Layer)
            .HasColumnName("layer")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.Subject)
            .HasColumnName("subject")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // String y no int, mismo criterio que layer y subject: agregar un origen no rompe filas ya
        // persistidas con el valor numérico de otro.
        builder.Property(i => i.Origin)
            .HasColumnName("origin")
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ItemOrigin.Seed)
            .IsRequired();

        builder.Property(i => i.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        // El converter se declara sobre el tipo NO nullable: EF resuelve el null antes de llamarlo.
        // Con lambdas sobre `ItemId?` infiere uno que recibe el null y explota al convertirlo.
        builder.Property(i => i.SupersedesItemId)
            .HasColumnName("supersedes_item_id")
            .HasConversion(new ValueConverter<ItemId, Guid>(
                id => id.Value,
                value => new ItemId(value)));

        // FK real: apunta a otra fila de esta misma tabla, así que no cruza schema y ADR-0017 no
        // aplica. Sin navigation property a propósito: el sucesor no tiene que arrastrar a su
        // antecesor cada vez que se carga, que es traer una pregunta retirada para ofrecer la de
        // hoy. Restrict porque un ítem no se borra nunca: se retira.
        builder.HasOne<Item>()
            .WithMany()
            .HasForeignKey(i => i.SupersedesItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.SupersedesItemId)
            .HasDatabaseName("ix_items_supersedes_item_id");

        builder.Property(i => i.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(i => i.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(i => i.RetiredAt)
            .HasColumnName("retired_at");

        builder.Property(i => i.LastChangedBy)
            .HasColumnName("last_changed_by");

        // El código es la identidad semántica del ítem (ver docstring de Item), y viaja en el CSV
        // público y en el Método: este UNIQUE es el reflejo en DB de ItemErrors.CodeAlreadyExists.
        builder.HasIndex(i => i.Code)
            .IsUnique()
            .HasDatabaseName("ux_items_code");

        builder.Ignore(i => i.DomainEvents);

        // Las opciones, tabla hija (US-198, ADR-0082). Clave compuesta (item_id, value): el Value es
        // lo que la respuesta persiste y no se recicla (ver docstring de ItemOption), así que es la
        // identidad natural de la fila, no un id propio.
        builder.OwnsMany(i => i.Options, o =>
        {
            o.ToTable("item_options");

            o.Property<ItemId>("item_id")
                .HasColumnName("item_id")
                .HasConversion(id => id.Value, value => new ItemId(value));

            o.WithOwner().HasForeignKey("item_id");

            // Sin ValueGeneratedNever, EF trata a Value como identity por ser un numérico parte de
            // la PK compuesta (convención de EF para PKs numéricas): generaría 1, 2, 3... por tabla
            // en vez de respetar el valor de negocio que elige quien curó el ítem.
            o.Property(op => op.Value)
                .HasColumnName("value")
                .ValueGeneratedNever();

            o.HasKey("item_id", "Value");

            o.Property(op => op.Order)
                .HasColumnName("order")
                .IsRequired();

            o.Property(op => op.Label)
                .HasColumnName("label")
                .HasMaxLength(ItemOption.MaxLabelLength)
                .IsRequired();

            o.Property(op => op.Valence)
                .HasColumnName("valence")
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();
        });

        builder.Navigation(i => i.Options).AutoInclude();
    }
}
