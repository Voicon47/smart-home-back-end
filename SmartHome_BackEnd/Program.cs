using Microsoft.EntityFrameworkCore;
using SmartHome_BackEnd.Data;

var builder = WebApplication.CreateBuilder(args);

//builder.WebHost.ConfigureKestrel(serverOptions =>
//{
//    serverOptions.Listen(System.Net.IPAddress.Any, 5222); // Replace with your port
//});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(corsPolicyBuilder =>
    {
        corsPolicyBuilder.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();




////
builder.Services.AddDbContext<DataContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));

});

var app = builder.Build();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(builder =>
{
    builder.AllowAnyOrigin();
    builder.AllowAnyMethod();
    builder.AllowAnyHeader();
});

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(2),
};
app.UseWebSockets(webSocketOptions);

app.Run();
