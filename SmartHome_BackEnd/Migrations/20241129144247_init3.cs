using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHome_BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class init3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<float>(
                name: "Temperature",
                table: "Sensors",
                type: "real",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AlterColumn<float>(
                name: "Humidity",
                table: "Sensors",
                type: "real",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "Temperature",
                table: "Sensors",
                type: "float",
                nullable: false,
                oldClrType: typeof(float),
                oldType: "real");

            migrationBuilder.AlterColumn<double>(
                name: "Humidity",
                table: "Sensors",
                type: "float",
                nullable: false,
                oldClrType: typeof(float),
                oldType: "real");
        }
    }
}
