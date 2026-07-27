using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <summary>
    /// Las franjas horarias pasan de tabla hija a documento embebido en la comisión (ADR-0053).
    /// </summary>
    /// <remarks>
    /// EF generó esta migración borrando la tabla PRIMERO y creando después la columna con
    /// <c>defaultValue: ""</c>, que además no es jsonb válido: se perdían todos los horarios y el DDL
    /// ni siquiera habría corrido. El orden correcto es columna nullable, backfill, NOT NULL, y recién
    /// ahí drop.
    ///
    /// <para>
    /// El <c>jsonb_build_object</c> arma exactamente el shape que espera el value converter
    /// (<c>day</c> como nombre del día, <c>start</c> y <c>end</c> como "HH:mm"). Si ese shape cambia,
    /// este backfill queda desalineado con el converter, pero es de una sola vez: a partir de acá el
    /// dueño del shape es el converter.
    /// </para>
    /// </remarks>
    public partial class CommissionSchedulesAsEmbeddedDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "schedules",
                schema: "academic",
                table: "commissions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE academic.commissions c
                   SET schedules = COALESCE((
                       SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'day',   cs.day_of_week,
                                      'start', to_char(cs.start_time, 'HH24:MI'),
                                      'end',   to_char(cs.end_time,   'HH24:MI'))
                                  ORDER BY cs.start_time)
                         FROM academic.commission_schedules cs
                        WHERE cs.commission_id = c.id), '[]'::jsonb);
                """);

            migrationBuilder.AlterColumn<string>(
                name: "schedules",
                schema: "academic",
                table: "commissions",
                type: "jsonb",
                nullable: false);

            migrationBuilder.DropTable(
                name: "commission_schedules",
                schema: "academic");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "commission_schedules",
                schema: "academic",
                columns: table => new
                {
                    commission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commission_schedules", x => new { x.commission_id, x.day_of_week, x.start_time });
                    table.CheckConstraint("ck_commission_schedules_end_after_start", "end_time > start_time");
                    table.ForeignKey(
                        name: "FK_commission_schedules_commissions_commission_id",
                        column: x => x.commission_id,
                        principalSchema: "academic",
                        principalTable: "commissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Devuelve las franjas del documento a la tabla antes de tirar la columna, para que el
            // Down sea reversible de verdad y no una pérdida de datos silenciosa.
            migrationBuilder.Sql(
                """
                INSERT INTO academic.commission_schedules (commission_id, day_of_week, start_time, end_time)
                SELECT c.id,
                       s->>'day',
                       (s->>'start')::time,
                       (s->>'end')::time
                  FROM academic.commissions c,
                       LATERAL jsonb_array_elements(c.schedules) AS s;
                """);

            migrationBuilder.DropColumn(
                name: "schedules",
                schema: "academic",
                table: "commissions");
        }
    }
}
