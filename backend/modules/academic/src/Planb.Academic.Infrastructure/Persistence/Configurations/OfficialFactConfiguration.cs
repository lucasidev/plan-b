using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class OfficialFactConfiguration : IEntityTypeConfiguration<OfficialFact>
{
    public void Configure(EntityTypeBuilder<OfficialFact> builder)
    {
        builder.ToTable("official_facts");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new OfficialFactId(value));

        builder.Property(f => f.SubjectType)
            .HasColumnName("subject_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Sin FK: subject_id referencia a universities, academic_units o careers según SubjectType
        // (ADR-0017, y acá ni siquiera es un solo target). El application layer valida existencia.
        builder.Property(f => f.SubjectId)
            .HasColumnName("subject_id")
            .IsRequired();

        builder.Property(f => f.Field)
            .HasColumnName("field")
            .HasMaxLength(OfficialFact.MaxFieldLength)
            .IsRequired();

        // Varias afirmaciones conviven para el mismo (subject_type, subject_id, field): dos fuentes
        // que no cierran, dos períodos. A propósito NO es un índice único (ADR-0090): la ficha decide
        // la vigente en el dominio (OfficialFactCurrency), no una constraint de la base. Este índice
        // es solo de performance, para el WHERE del read por sujeto.
        builder.HasIndex(f => new { f.SubjectType, f.SubjectId, f.Field })
            .HasDatabaseName("ix_official_facts_subject_field");

        builder.Property(f => f.Value)
            .HasColumnName("value")
            .HasMaxLength(OfficialFact.MaxValueLength);

        builder.Property(f => f.Unit)
            .HasColumnName("unit")
            .HasMaxLength(OfficialFact.MaxUnitLength);

        builder.Property(f => f.Period)
            .HasColumnName("period")
            .HasMaxLength(OfficialFact.MaxPeriodLength);

        builder.Property(f => f.SourceName)
            .HasColumnName("source_name")
            .HasMaxLength(OfficialFact.MaxSourceNameLength)
            .IsRequired();

        builder.Property(f => f.SourceUrl)
            .HasColumnName("source_url")
            .HasMaxLength(OfficialFact.MaxSourceUrlLength)
            .IsRequired();

        builder.Property(f => f.SourceDocument)
            .HasColumnName("source_document")
            .HasMaxLength(OfficialFact.MaxSourceDocumentLength);

        builder.Property(f => f.SourceRetrievedAt)
            .HasColumnName("source_retrieved_at")
            .IsRequired();

        builder.Property(f => f.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(f => f.DerivationRuleId)
            .HasColumnName("derivation_rule_id")
            .HasMaxLength(OfficialFact.MaxDerivationRuleIdLength);

        builder.Property(f => f.Note)
            .HasColumnName("note")
            .HasMaxLength(OfficialFact.MaxNoteLength);

        builder.Property(f => f.RelievedAt)
            .HasColumnName("relieved_at")
            .IsRequired();

        builder.Property(f => f.RelievedBy)
            .HasColumnName("relieved_by")
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Ignore(f => f.DomainEvents);
    }
}
