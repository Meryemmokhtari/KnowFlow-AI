using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Qdrant.Client;
using SearchService.Interfaces;
using SearchService.Services;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "KnowFlow AI - SearchService",
            Version = "v1",
            Description = "Semantic Search API"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================================
// JWT CONFIGURATION
// =====================================================

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing from SearchService appsettings.json");
}

Console.WriteLine("==============================================");
Console.WriteLine("SEARCH SERVICE JWT CONFIGURATION");
Console.WriteLine($"JWT Key loaded: {!string.IsNullOrWhiteSpace(jwtKey)}");
Console.WriteLine($"JWT Key length: {jwtKey.Length}");
Console.WriteLine("==============================================");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;

        options.SaveToken = false;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ValidateIssuer = false,
                ValidateAudience = false,

                ValidateLifetime = true,

                ClockSkew = TimeSpan.FromMinutes(2),

                NameClaimType =
                    ClaimTypes.NameIdentifier
            };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authorization =
                    context.Request.Headers.Authorization
                        .FirstOrDefault();

                Console.WriteLine();
                Console.WriteLine("----------------------------------------------");
                Console.WriteLine("SEARCH SERVICE JWT REQUEST");
                Console.WriteLine(
                    $"Method: {context.Request.Method}");
                Console.WriteLine(
                    $"Path: {context.Request.Path}");
                Console.WriteLine(
                    $"Authorization present: {!string.IsNullOrWhiteSpace(authorization)}");
                Console.WriteLine("----------------------------------------------");

                return Task.CompletedTask;
            },

            OnTokenValidated = context =>
            {
                var userId =
                    context.Principal?
                        .FindFirstValue(ClaimTypes.NameIdentifier)
                    ??
                    context.Principal?
                        .FindFirstValue("sub")
                    ??
                    context.Principal?
                        .FindFirstValue("userId");

                var userName =
                    context.Principal?
                        .FindFirstValue(ClaimTypes.Name)
                    ??
                    context.Principal?
                        .FindFirstValue("name")
                    ??
                    context.Principal?
                        .FindFirstValue("email")
                    ??
                    "Unknown";

                Console.WriteLine();
                Console.WriteLine(
                    "==============================================");

                Console.WriteLine(
                    "SEARCH SERVICE JWT VALIDATED");

                Console.WriteLine(
                    $"UserId: {userId}");

                Console.WriteLine(
                    $"User: {userName}");

                Console.WriteLine(
                    "==============================================");

                Console.WriteLine();

                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                Console.WriteLine();
                Console.WriteLine(
                    "==============================================");

                Console.WriteLine(
                    "SEARCH SERVICE JWT AUTHENTICATION FAILED");

                Console.WriteLine(
                    $"Error: {context.Exception.Message}");

                Console.WriteLine(
                    "==============================================");

                Console.WriteLine();

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine();
                Console.WriteLine(
                    "==============================================");

                Console.WriteLine(
                    "SEARCH SERVICE JWT 401 CHALLENGE");

                Console.WriteLine(
                    $"Error: {context.Error}");

                Console.WriteLine(
                    $"Description: {context.ErrorDescription}");

                Console.WriteLine(
                    "==============================================");

                Console.WriteLine();

                return Task.CompletedTask;
            }
        };
    });

// =====================================================
// AUTHORIZATION
// =====================================================

builder.Services.AddAuthorization();

// =====================================================
// QDRANT
// =====================================================

builder.Services.AddSingleton(
    new QdrantClient(
        host: "localhost",
        port: 6334
    )
);

// =====================================================
// AUTH SERVICE HTTP CLIENT
// =====================================================

builder.Services.AddHttpClient(
    "AuthService",
    client =>
    {
        client.BaseAddress =
            new Uri(
                builder.Configuration["AuthService:BaseUrl"]
                ?? "http://localhost:5282/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(30);
    }
);

// =====================================================
// DOCUMENT SERVICE HTTP CLIENT
// =====================================================

builder.Services.AddHttpClient(
    "DocumentService",
    client =>
    {
        client.BaseAddress =
            new Uri(
                builder.Configuration["DocumentService:BaseUrl"]
                ?? "http://localhost:5260/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(30);
    }
);

// =====================================================
// AI SERVICE HTTP CLIENT
// =====================================================

builder.Services.AddHttpClient(
    "AIService",
    client =>
    {
        client.BaseAddress =
            new Uri(
                builder.Configuration["AIService:BaseUrl"]
                ?? "http://localhost:5057/"
            );

        client.Timeout =
            TimeSpan.FromMinutes(5);
    }
);

// =====================================================
// OLLAMA EMBEDDING CLIENT
// =====================================================

builder.Services.AddHttpClient(
    "OllamaEmbedding",
    client =>
    {
        client.BaseAddress =
            new Uri(
                builder.Configuration["Ollama:BaseUrl"]
                ?? "http://localhost:11434/"
            );

        client.Timeout =
            TimeSpan.FromMinutes(2);
    }
);

// =====================================================
// SEARCH SERVICE
// =====================================================

builder.Services.AddScoped<
    ISearchService,
    SearchServiceManager
>();

// =====================================================
// BUILD APPLICATION
// =====================================================

var app = builder.Build();

// =====================================================
// SWAGGER
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.UseCors("AllowFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// =====================================================
// START
// =====================================================

Console.WriteLine();

Console.WriteLine(
    "==============================================");

Console.WriteLine(
    "KNOWFLOW SEARCH SERVICE");

Console.WriteLine(
    "==============================================");

Console.WriteLine(
    "SearchService started successfully.");

Console.WriteLine(
    "Qdrant: localhost:6334");

Console.WriteLine(
    "Ollama: localhost:11434");

Console.WriteLine(
    "DocumentService: localhost:5260");

Console.WriteLine(
    "==============================================");

Console.WriteLine();

app.Run();