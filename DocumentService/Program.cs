using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DocumentService.Data;
using DocumentService.Interfaces;
using DocumentService.Repositories;
using DocumentService.Services;
using Qdrant.Client;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// DATABASE
// =====================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services.AddControllers();

// =====================================================
// JWT AUTHENTICATION
// =====================================================

var jwtKey =
    builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing from DocumentService appsettings.json"
    );
}

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

                ClockSkew = TimeSpan.Zero
            };
    });

// =====================================================
// AUTHORIZATION
// =====================================================

builder.Services.AddAuthorization();

// =====================================================
// HTTP CLIENT - OLLAMA
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
            TimeSpan.FromSeconds(120);
    }
);

// =====================================================
// HTTP CLIENT - AI SERVICE
// =====================================================

builder.Services.AddHttpClient(
    "AIClient",
    client =>
    {
        client.BaseAddress =
            new Uri(
                builder.Configuration["AIService:BaseUrl"]
                ?? "http://localhost:5057/"
            );

        client.Timeout =
            TimeSpan.FromSeconds(120);
    }
);

// =====================================================
// HTTP CLIENT - AUTH SERVICE
// =====================================================

builder.Services.AddHttpClient(
    "AuthClient",
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
// REPOSITORIES
// =====================================================

builder.Services.AddScoped<
    IDocumentRepository,
    DocumentRepository
>();

// =====================================================
// DOCUMENT SERVICES
// =====================================================

builder.Services.AddScoped<
    IDocumentService,
    DocumentServiceManager
>();

builder.Services.AddScoped<
    IEmbeddingService,
    EmbeddingService
>();

builder.Services.AddScoped<
    IQdrantService,
    QdrantService
>();

builder.Services.AddScoped<
    ITextExtractionService,
    TextExtractionService
>();

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
// SWAGGER
// =====================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type =
                Microsoft.OpenApi.Models.SecuritySchemeType.Http,

            Scheme = "bearer",

            BearerFormat = "JWT",

            In =
                Microsoft.OpenApi.Models.ParameterLocation.Header,

            Description =
                "Enter JWT token: Bearer {your token}"
        }
    );

    options.AddSecurityRequirement(
        new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference =
                        new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type =
                                Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,

                            Id = "Bearer"
                        }
                },

                Array.Empty<string>()
            }
        }
    );
});

// =====================================================
// CORS - REACT FRONTEND
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

// =====================================================
// BUILD APP
// =====================================================

var app = builder.Build();

// =====================================================
// DEVELOPMENT
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// =====================================================
// CORS
// =====================================================

app.UseCors("AllowFrontend");

// =====================================================
// AUTHENTICATION
// =====================================================

app.UseAuthentication();

// =====================================================
// AUTHORIZATION
// =====================================================

app.UseAuthorization();

// =====================================================
// HTTPS
// =====================================================

// Disabled because frontend uses HTTP localhost:5173
// and DocumentService HTTP localhost:5260.

// app.UseHttpsRedirection();

// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();

// =====================================================
// RUN
// =====================================================

app.Run();