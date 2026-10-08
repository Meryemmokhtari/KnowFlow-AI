
using AuthService.Interfaces;
using AuthService.Models;

using Microsoft.IdentityModel.Tokens;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // =====================================================
        // GENERATE JWT TOKEN
        // =====================================================

        public string GenerateToken(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            if (user.Role == null)
            {
                throw new Exception(
                    "User role is not loaded."
                );
            }

            // =====================================================
            // JWT CONFIGURATION
            // =====================================================

            var jwtKey =
                _configuration["Jwt:Key"];

            var issuer =
                _configuration["Jwt:Issuer"];

            var audience =
                _configuration["Jwt:Audience"];

            var durationValue =
                _configuration["Jwt:DurationInMinutes"];


            // =====================================================
            // VALIDATE CONFIGURATION
            // =====================================================

            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new Exception(
                    "JWT Key is missing."
                );
            }

            if (string.IsNullOrWhiteSpace(issuer))
            {
                throw new Exception(
                    "JWT Issuer is missing."
                );
            }

            if (string.IsNullOrWhiteSpace(audience))
            {
                throw new Exception(
                    "JWT Audience is missing."
                );
            }


            // =====================================================
            // TOKEN DURATION
            // =====================================================

            if (!double.TryParse(
                durationValue,
                out double duration
            ))
            {
                duration = 60;
            }

            // Prevent invalid duration
            if (duration <= 0)
            {
                duration = 60;
            }


            // =====================================================
            // SECURITY KEY
            // =====================================================

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)
                );


            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );


            // =====================================================
            // ROLE
            // =====================================================

            var role =
                user.Role.Name?.Trim();

            if (string.IsNullOrWhiteSpace(role))
            {
                role = "User";
            }


            // =====================================================
            // FULL NAME
            // =====================================================

            var fullName =
                $"{user.FirstName} {user.LastName}"
                    .Trim();

            if (string.IsNullOrWhiteSpace(fullName))
            {
                fullName =
                    user.Email ?? "User";
            }


            // =====================================================
            // CLAIMS
            // =====================================================

            var claims =
                new List<Claim>
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.Id.ToString()
                    ),

                    new Claim(
                        JwtRegisteredClaimNames.Sub,
                        user.Id.ToString()
                    ),

                    new Claim(
                        ClaimTypes.Email,
                        user.Email ?? string.Empty
                    ),

                    new Claim(
                        JwtRegisteredClaimNames.Email,
                        user.Email ?? string.Empty
                    ),

                    new Claim(
                        ClaimTypes.Role,
                        role
                    ),

                    new Claim(
                        ClaimTypes.Name,
                        fullName
                    )
                };


            // =====================================================
            // CREATE TOKEN
            // =====================================================

            var token =
                new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,

                    notBefore:
                        DateTime.UtcNow,

                    expires:
                        DateTime.UtcNow.AddMinutes(
                            duration
                        ),

                    signingCredentials:
                        credentials
                );


            // =====================================================
            // RETURN TOKEN
            // =====================================================

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}
