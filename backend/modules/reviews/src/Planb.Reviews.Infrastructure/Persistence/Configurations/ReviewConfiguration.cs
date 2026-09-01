using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ReviewId(value));

        // Cross-aggregate refs (ADR-0017): UUIDs sin FK Postgres. AccountId, SubjectId y TermId
        // viven en otros schemas (identity, academic). ChairId también es cross-schema
        // y encima opcional: null es "No sé", una respuesta legítima (ver docstring de ChairId).
        builder.Property(r => r.AccountId)
            .HasColumnName("account_id")
            .IsRequired();

        builder.Property(r => r.SubjectId)
            .HasColumnName("subject_id")
            .IsRequired();

        builder.Property(r => r.TermId)
            .HasColumnName("term_id")
            .IsRequired();

        builder.Property(r => r.ChairId)
            .HasColumnName("chair_id");

        builder.Property(r => r.InstrumentId)
            .HasColumnName("instrument_id")
            .HasConversion(id => id.Value, value => new InstrumentId(value))
            .IsRequired();

        builder.Property(r => r.FreeText)
            .HasColumnName("free_text")
            .HasMaxLength(Review.MaxFreeTextLength);

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Una voz por cuenta, materia y período (ADR-0082): el invariante central del aggregate.
        // Reseñar de nuevo la misma cursada es editar la reseña que ya existe; este UNIQUE es la red
        // de base en DB detrás de ReviewErrors.AlreadyReviewed.
        builder.HasIndex(r => new { r.AccountId, r.SubjectId, r.TermId })
            .IsUnique()
            .HasDatabaseName("ux_reviews_account_subject_term");

        // Todo lo que el producto publica se cuenta por cátedra: la ficha de cátedra filtra por
        // `chair_id` tres veces (su conteo, la distribución de cada ítem y la comparación contra
        // las hermanas), y la cobertura de una carrera y el estado de Inicio agrupan por lo mismo.
        // Sin este índice esas lecturas barren la tabla entera.
        //
        // Parcial porque `chair_id` es nullable y declarar la cátedra es opcional: la reseña sin
        // cátedra no entra en ninguno de esos filtros, así que tampoco tiene que ocupar el índice.
        builder.HasIndex(r => r.ChairId)
            .HasDatabaseName("ix_reviews_chair")
            .HasFilter("chair_id IS NOT NULL");

        builder.Ignore(r => r.DomainEvents);

        // Lo respondido, tabla hija (US-146, ADR-0082). Clave compuesta (review_id, item_id):
        // el ítem no puede responderse dos veces en la misma reseña (ReviewErrors.DuplicateAnswer).
        builder.OwnsMany(r => r.Answers, a =>
        {
            a.ToTable("review_answers");

            a.Property<ReviewId>("review_id")
                .HasColumnName("review_id")
                .HasConversion(id => id.Value, value => new ReviewId(value));

            a.WithOwner().HasForeignKey("review_id");

            // Ref cross-aggregate hacia Item, Guid plano vía el converter del VO (sin FK Postgres,
            // ADR-0017: ItemAnswer vive en la reseña, Item en el catálogo, aggregates distintos).
            a.Property(x => x.ItemId)
                .HasColumnName("item_id")
                .HasConversion(id => id.Value, value => new ItemId(value));

            a.HasKey("review_id", "ItemId");

            // option_value es un short de negocio (la opción que se eligió, ver ItemAnswer.OptionValue):
            // sin ValueGeneratedNever, la convención de EF lo trata como identity por ser numérico y
            // parte de la PK compuesta, mismo bug que ItemOption.Value en ItemConfiguration.
            a.Property(x => x.OptionValue)
                .HasColumnName("option_value")
                .ValueGeneratedNever();
        });

        builder.Navigation(r => r.Answers).AutoInclude();
    }
}
