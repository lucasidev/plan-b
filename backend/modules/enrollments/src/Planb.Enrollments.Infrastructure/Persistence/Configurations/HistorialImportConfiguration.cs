using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Infrastructure.Persistence.Configurations;

internal sealed class HistorialImportConfiguration : IEntityTypeConfiguration<HistorialImport>
{
    private static readonly JsonSerializerOptions PayloadJsonOptions = new(JsonSerializerDefaults.Web)
    {
        // Property names en camelCase, enums como strings, sin nulls indented para minimizar
        // tamaño en disco. El JSONB de Postgres no necesita pretty-printing.
        WriteIndented = false,
    };

    public void Configure(EntityTypeBuilder<HistorialImport> builder)
    {
        builder.ToTable("historial_imports");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new HistorialImportId(value));

        builder.Property(i => i.StudentProfileId)
            .HasColumnName("student_profile_id")
            .IsRequired();

        builder.HasIndex(i => i.StudentProfileId)
            .HasDatabaseName("ix_historial_imports_student");

        builder.Property(i => i.SourceType)
            .HasColumnName("source_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // raw_payload: JSONB, value converter de string ↔ HistorialImportPayload. EF Core
        // 10 soporta `HasConversion<JsonValueConverter<T>>` para esto, pero el inline anonymous
        // lambda funciona idéntico y queda explícito el contrato JSON.
        builder.Property(i => i.Payload)
            .HasColumnName("raw_payload")
            .HasColumnType("jsonb")
            .HasConversion(
                payload => payload == null
                    ? null
                    : JsonSerializer.Serialize(payload, PayloadJsonOptions),
                json => string.IsNullOrEmpty(json)
                    ? null
                    : JsonSerializer.Deserialize<HistorialImportPayload>(json, PayloadJsonOptions));

        builder.Property(i => i.Error)
            .HasColumnName("error")
            .HasMaxLength(2000);

        builder.Property(i => i.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(i => i.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(i => i.ParsedAt)
            .HasColumnName("parsed_at");

        builder.Property(i => i.ConfirmedAt)
            .HasColumnName("confirmed_at");

        // CHECKs defensivos: status terminal coherente con timestamps.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_historial_imports_parsed_timestamp",
                "(status NOT IN ('Parsed','Confirmed')) OR parsed_at IS NOT NULL");
            t.HasCheckConstraint(
                "ck_historial_imports_confirmed_timestamp",
                "(status <> 'Confirmed') OR confirmed_at IS NOT NULL");
            t.HasCheckConstraint(
                "ck_historial_imports_failed_has_error",
                "(status <> 'Failed') OR error IS NOT NULL");
        });

        builder.Ignore(i => i.DomainEvents);
    }
}
