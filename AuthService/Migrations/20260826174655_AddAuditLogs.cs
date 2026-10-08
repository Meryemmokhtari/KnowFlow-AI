using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "MySql:ValueGenerationStrategy",
                            MySqlValueGenerationStrategy.IdentityColumn),

                    UserId = table.Column<string>(
                        type: "varchar(100)",
                        maxLength: 100,
                        nullable: true)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    UserName = table.Column<string>(
                        type: "varchar(150)",
                        maxLength: 150,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Action = table.Column<string>(
                        type: "varchar(100)",
                        maxLength: 100,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Category = table.Column<string>(
                        type: "varchar(100)",
                        maxLength: 100,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Target = table.Column<string>(
                        type: "varchar(255)",
                        maxLength: 255,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Description = table.Column<string>(
                        type: "varchar(1000)",
                        maxLength: 1000,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Status = table.Column<string>(
                        type: "varchar(30)",
                        maxLength: 30,
                        nullable: false)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    Timestamp = table.Column<DateTime>(
                        type: "datetime(6)",
                        nullable: false),

                    IpAddress = table.Column<string>(
                        type: "varchar(100)",
                        maxLength: 100,
                        nullable: true)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4"),

                    UserAgent = table.Column<string>(
                        type: "varchar(1000)",
                        maxLength: 1000,
                        nullable: true)
                        .Annotation(
                            "MySql:CharSet",
                            "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_AuditLogs",
                        x => x.Id);
                })
                .Annotation(
                    "MySql:CharSet",
                    "utf8mb4");

            // ================================
            // INDEXES
            // ================================

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Category",
                table: "AuditLogs",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Status",
                table: "AuditLogs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");
        }
    }
}