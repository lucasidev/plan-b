using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Planning.Domain.Drafts;

namespace Planb.Planning.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF mapping para <see cref="SimulationDraft"/> en el schema <c>planning</c> (US-023). Refs
/// cross-BC (<c>owner_profile_id</c>, <c>term_id</c>, <c>subject_id</c>, <c>commission_id</c>) son
/// columnas UUID planas sin FK (ADR-0017).
/// </summary>
internal sealed class SimulationDraftConfiguration : IEntityTypeConfiguration<SimulationDraft>
{
    public void Configure(EntityTypeBuilder<SimulationDraft> builder)
    {
        builder.ToTable("simulation_drafts", t =>
        {
            // El data-model declaraba estos dos invariantes y no existían en la base. Hoy los sostiene
            // el aggregate (Share y Unshare mueven visibility y shared_at juntos), pero el read del
            // feed público asume el primero al desreferenciar shared_at, y una sola fila Shared con
            // shared_at nulo (fix manual de datos, backfill, o un método futuro que toque visibility
            // sin la fecha) tiraría el feed entero de una carrera, no solo ese item.
            //
            // Van como dos CHECK y no como uno bicondicional para que el error nombre cuál se violó.
            t.HasCheckConstraint(
                "ck_simulation_drafts_shared_requires_shared_at",
                "visibility <> 'Shared' OR shared_at IS NOT NULL");
            t.HasCheckConstraint(
                "ck_simulation_drafts_private_has_no_shared_at",
                "visibility <> 'Private' OR shared_at IS NULL");
        });

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new SimulationDraftId(value));

        builder.Property(d => d.OwnerProfileId).HasColumnName("owner_profile_id").IsRequired();
        builder.Property(d => d.TermId).HasColumnName("term_id").IsRequired();

        builder.Property(d => d.Label)
            .HasColumnName("label")
            .HasMaxLength(SimulationDraft.MaxLabelLength);

        builder.Property(d => d.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.Property(d => d.Visibility)
            .HasColumnName("visibility")
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.Property(d => d.SharedAt).HasColumnName("shared_at");

        builder.Property(d => d.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Sirve tanto el listado por owner (GET /drafts) como el lookup del promote (owner + term +
        // Active): el prefijo (owner_profile_id) cubre el primero, el índice completo el segundo.
        builder.HasIndex(d => new { d.OwnerProfileId, d.TermId, d.Status })
            .HasDatabaseName("ix_simulation_drafts_owner_term_status");

        // "Un solo plan vigente por (alumno, período)" es el único invariante del aggregate que cruza
        // filas, así que el aggregate por sí solo no puede sostenerlo: el handler de promote lee
        // "¿hay otro Active?" y después escribe, y con Read Committed dos promotes concurrentes de
        // borradores distintos ven los dos que no hay ninguno y commitean los dos. El estado que
        // queda es pegajoso: el próximo promote archiva uno solo, así que el segundo activo se queda
        // para siempre.
        //
        // El proyecto ya usaba índices únicos parciales como red para invariantes equivalentes en
        // reviews, enrollments, academic y moderation, y los documentó como "belt + suspenders".
        // Planning era la excepción sin razón escrita.
        builder.HasIndex(d => new { d.OwnerProfileId, d.TermId })
            .IsUnique()
            .HasDatabaseName("ux_simulation_drafts_owner_term_active")
            .HasFilter("status = 'Active'");

        builder.Ignore(d => d.DomainEvents);

        builder.OwnsMany(d => d.Items, i =>
        {
            i.ToTable("simulation_draft_items");

            i.Property<SimulationDraftId>("draft_id")
                .HasColumnName("draft_id")
                .HasConversion(id => id.Value, value => new SimulationDraftId(value));

            i.WithOwner().HasForeignKey("draft_id");

            // ValueGeneratedNever explícito: por default, EF Core marca un Guid que integra una key
            // compuesta como ValueGeneratedOnAdd (asume que se autogenera). Como SubjectId siempre lo
            // manda el caller (nunca se genera), sin este override un item agregado a la colección de
            // un SimulationDraft ya trackeado (Unchanged) se descubre como Modified en vez de Added,
            // y el UPDATE resultante apunta a una fila que nunca existió (DbUpdateConcurrencyException,
            // 0 filas afectadas). CommissionTeacher/CommissionSchedule en Academic no lo sufren porque
            // sus key properties son value objects convertidos o no-Guid, no un Guid plano.
            i.Property(x => x.SubjectId)
                .HasColumnName("subject_id")
                .ValueGeneratedNever()
                .IsRequired();
            i.Property(x => x.CommissionId).HasColumnName("commission_id");

            // PRIMARY KEY (draft_id, subject_id): una materia no se repite en el mismo borrador.
            i.HasKey("draft_id", "SubjectId");
        });

        builder.Navigation(d => d.Items).AutoInclude();
    }
}
