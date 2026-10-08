using System.Security.Claims;
using System.Text;

using AuthService.Data;
using AuthService.Interfaces;
using AuthService.Repositories;
using AuthService.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services.AddControllers();

// =====================================================
// HTTP CONTEXT
// =====================================================

builder.Services.AddHttpContextAccessor();

// =====================================================
// DATABASE
// =====================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured."
    );
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    );
});

// =====================================================
// DEPENDENCY INJECTION
// =====================================================

// User Repository
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Authentication
builder.Services.AddScoped<IAuthService, AuthServiceManager>();

// JWT
builder.Services.AddScoped<IJwtService, JwtService>();

// Audit Logs
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Notifications
builder.Services.AddScoped<
    INotificationService,
    NotificationService
>();

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// =====================================================
// JWT CONFIGURATION
// =====================================================

var jwtKey =
    builder.Configuration["Jwt:Key"];

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"];

var jwtAudience =
    builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key is not configured."
    );
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "Jwt:Issuer is not configured."
    );
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "Jwt:Audience is not configured."
    );
}

// =====================================================
// AUTHENTICATION
// =====================================================

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
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,

                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ClockSkew = TimeSpan.Zero,

                NameClaimType = ClaimTypes.Name,

                RoleClaimType = ClaimTypes.Role
            };

        options.Events = new JwtBearerEvents
        {
            // -----------------------------------------
            // JWT ERROR
            // -----------------------------------------

            OnAuthenticationFailed = context =>
            {
                Console.WriteLine(
                    "========================================"
                );

                Console.WriteLine(
                    "JWT AUTHENTICATION ERROR"
                );

                Console.WriteLine(
                    context.Exception.Message
                );

                Console.WriteLine(
                    "========================================"
                );

                return Task.CompletedTask;
            },

            // -----------------------------------------
            // TOKEN VALIDATED
            // -----------------------------------------

            OnTokenValidated = context =>
            {
                Console.WriteLine(
                    "========================================"
                );

                Console.WriteLine(
                    "JWT TOKEN VALIDATED SUCCESSFULLY"
                );

                var userId =
                    context.Principal?
                        .FindFirst(ClaimTypes.NameIdentifier)?
                        .Value;

                if (string.IsNullOrWhiteSpace(userId))
                {
                    userId =
                        context.Principal?
                            .FindFirst(
                                System.IdentityModel.Tokens.Jwt
                                    .JwtRegisteredClaimNames.Sub
                            )?
                            .Value;
                }

                Console.WriteLine(
                    $"Authenticated User ID: {userId}"
                );

                Console.WriteLine(
                    "========================================"
                );

                return Task.CompletedTask;
            },

            // -----------------------------------------
            // TOKEN MESSAGE RECEIVED
            // -----------------------------------------

            OnMessageReceived = context =>
            {
                if (!string.IsNullOrWhiteSpace(
                    context.Token))
                {
                    Console.WriteLine(
                        "JWT TOKEN RECEIVED"
                    );
                }

                return Task.CompletedTask;
            }
        };
    });

// =====================================================
// AUTHORIZATION
// =====================================================

builder.Services.AddAuthorization();

// =====================================================
// SWAGGER
// =====================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "KnowFlow AI - AuthService",
            Version = "v1",
            Description =
                "Authentication, Users, Roles, Audit Logs and Notifications API"
        }
    );

    // -----------------------------------------
    // JWT SECURITY DEFINITION
    // -----------------------------------------

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type = SecuritySchemeType.Http,

            Scheme = "bearer",

            BearerFormat = "JWT",

            In = ParameterLocation.Header,

            Description =
                "Enter your JWT token. Example: Bearer eyJhbGciOi..."
        }
    );

    // -----------------------------------------
    // JWT SECURITY REQUIREMENT
    // -----------------------------------------

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,

                            Id = "Bearer"
                        }
                },

                Array.Empty<string>()
            }
        }
    );
});

// =====================================================
// BUILD
// =====================================================

var app = builder.Build();

// =====================================================
// SWAGGER
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "KnowFlow AI AuthService v1"
        );
    });
}

// =====================================================
// HTTPS
// =====================================================

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// =====================================================
// CORS
// =====================================================

app.UseCors("AllowReact");

// =====================================================
// AUTHENTICATION
// =====================================================

app.UseAuthentication();

// =====================================================
// AUTHORIZATION
// =====================================================

app.UseAuthorization();

// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();

// =====================================================
// START APPLICATION
// =====================================================

Console.WriteLine(
    "========================================"
);

Console.WriteLine(
    "KnowFlow AI - AuthService"
);

Console.WriteLine(
    "AuthService started successfully."
);

Console.WriteLine(
    "========================================"
);

app.Run();