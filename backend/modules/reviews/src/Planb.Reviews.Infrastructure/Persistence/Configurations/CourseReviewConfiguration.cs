using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.CourseReviews;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class CourseReviewConfiguration : IEntityTypeConfiguration<CourseReview>
{
    public void Configure(EntityTypeBuilder<CourseReview> builder)
    {
        builder.ToTable("course_reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CourseReviewId(value));

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
            .HasMaxLength(CourseReview.MaxFreeTextLength);

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Una voz por cuenta, materia y período (ADR-0082): el invariante central del aggregate.
        // Reseñar de nuevo la misma cursada es editar la reseña que ya existe; este UNIQUE es la red
        // de base en DB detrás de CourseReviewErrors.AlreadyReviewed.
        builder.HasIndex(r => new { r.AccountId, r.SubjectId, r.TermId })
            .IsUnique()
            .HasDatabaseName("ux_course_reviews_account_subject_term");

        builder.Ignore(r => r.DomainEvents);

        // Lo respondido, tabla hija (US-146, ADR-0082). Clave compuesta (course_review_id, item_id):
        // el ítem no puede responderse dos veces en la misma reseña (CourseReviewErrors.DuplicateAnswer).
        builder.OwnsMany(r => r.Answers, a =>
        {
            a.ToTable("course_review_answers");

            a.Property<CourseReviewId>("course_review_id")
                .HasColumnName("course_review_id")
                .HasConversion(id => id.Value, value => new CourseReviewId(value));

            a.WithOwner().HasForeignKey("course_review_id");

            // Ref cross-aggregate hacia Item, Guid plano vía el converter del VO (sin FK Postgres,
            // ADR-0017: ItemAnswer vive en la reseña, Item en el catálogo, aggregates distintos).
            a.Property(x => x.ItemId)
                .HasColumnName("item_id")
                .HasConversion(id => id.Value, value => new ItemId(value));

            a.HasKey("course_review_id", "ItemId");

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
