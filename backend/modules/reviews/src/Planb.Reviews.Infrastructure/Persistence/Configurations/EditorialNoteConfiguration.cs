using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Reviews.Domain.Curation;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class EditorialNoteConfiguration : IEntityTypeConfiguration<EditorialNote>
{
    public void Configure(EntityTypeBuilder<EditorialNote> builder)
    {
        builder.ToTable("editorial_notes");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new EditorialNoteId(value));

        // Ref cross-BC a la carrera: columna sin FK Postgres (ADR-0017), validada en el
        // application layer contra el contrato de academic.
        builder.Property(n => n.CareerId).HasColumnName("career_id").IsRequired();

        builder.Property(n => n.Text)
            .HasColumnName("text")
            .HasMaxLength(EditorialNote.MaxTextLength)
            .IsRequired();

        builder.Property(n => n.PublishedAt).HasColumnName("published_at").IsRequired();
        builder.Property(n => n.WithdrawnAt).HasColumnName("withdrawn_at");

        builder.Ignore(n => n.IsPublished);

        // La ficha de una carrera pide sus notas vigentes, que es la única lectura que existe.
        builder.HasIndex(n => new { n.CareerId, n.WithdrawnAt })
            .HasDatabaseName("ix_editorial_notes_career");
    }
}
