using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SubjectFieldsOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects");

            migrationBuilder.AlterColumn<int>(
                name: "weekly_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "total_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "term_kind",
                schema: "academic",
                table: "subjects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "code",
                schema: "academic",
                table: "subjects",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.AddCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects",
                sql: "(term_kind IS NULL AND term_in_year IS NULL) OR (term_kind = 'FullYear' AND term_in_year IS NULL) OR (term_kind IS NOT NULL AND term_kind <> 'FullYear' AND term_in_year IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down() vuelve estas columnas a NOT NULL. Con materias reales sin código, cadencia u
            // horas (ADR-0097: la fuente no siempre las publica), completar con 0/'' falsearía el
            // dato y dejar un DEFAULT lo repetiría en cada alta futura; frenamos antes, con un
            // mensaje que dice qué revisar, en vez del error genérico de Postgres o un rollback
            // silencioso.
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM academic.subjects
                        WHERE code IS NULL OR term_kind IS NULL OR weekly_hours IS NULL OR total_hours IS NULL
                    ) THEN
                        RAISE EXCEPTION 'SubjectFieldsOptional Down(): academic.subjects has rows with a null code, term_kind, weekly_hours or total_hours. Backfill or remove them before rolling back this migration.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects");

            migrationBuilder.AlterColumn<int>(
                name: "weekly_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "total_hours",
                schema: "academic",
                table: "subjects",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "term_kind",
                schema: "academic",
                table: "subjects",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "code",
                schema: "academic",
                table: "subjects",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_subjects_term_kind_year_consistency",
                schema: "academic",
                table: "subjects",
                sql: "(term_kind = 'FullYear' AND term_in_year IS NULL) OR (term_kind <> 'FullYear' AND term_in_year IS NOT NULL)");
        }
    }
}
