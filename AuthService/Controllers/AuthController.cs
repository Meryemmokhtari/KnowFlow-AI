using AuthService.DTOs;
using AuthService.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAuditLogService _auditLogService;

        public AuthController(
            IAuthService authService,
            IAuditLogService auditLogService)
        {
            _authService = authService;
            _auditLogService = auditLogService;
        }

        // =====================================================
        // REGISTER
        // POST /api/Auth/register
        // =====================================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message = "Registration data is required."
                });
            }

            try
            {
                var user =
                    await _authService.RegisterAsync(dto);

                // =================================================
                // AUDIT - REGISTER
                // =================================================

                await SafeAuditAsync(
                    userId: null,
                    userName: GetClaimName() ?? "New User",
                    action: "Register",
                    category: "Authentication",
                    target: "AuthService",
                    description: "New user registered successfully.",
                    status: "Success"
                );

                return Ok(user);
            }
            catch (Exception ex)
            {
                await SafeAuditAsync(
                    userId: null,
                    userName: "Unknown User",
                    action: "Register Failed",
                    category: "Authentication",
                    target: "AuthService",
                    description: "User registration failed.",
                    status: "Failed"
                );

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // LOGIN
        // POST /api/Auth/login
        // =====================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message = "Login data is required."
                });
            }

            try
            {
                var token =
                    await _authService.LoginAsync(dto);

                // =================================================
                // Decode token to get real user information
                // =================================================

                var userInfo =
                    GetUserInfoFromToken(token);

                await SafeAuditAsync(
                    userId: userInfo.UserId,
                    userName: userInfo.UserName
                        ?? dto.Email
                        ?? "User",
                    action: "Login",
                    category: "Authentication",
                    target: "AuthService",
                    description: "User logged in successfully.",
                    status: "Success"
                );

                return Ok(new
                {
                    token
                });
            }
            catch (Exception ex)
            {
                // =================================================
                // LOGIN FAILED
                // =================================================

                await SafeAuditAsync(
                    userId: null,
                    userName: dto.Email ?? "Unknown User",
                    action: "Login Failed",
                    category: "Authentication",
                    target: "AuthService",
                    description: "Failed login attempt.",
                    status: "Failed"
                );

                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // CURRENT USER
        // GET /api/Auth/me
        // =====================================================

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            try
            {
                var email =
                    User.FindFirst(ClaimTypes.Email)?.Value
                    ??
                    User.FindFirst(
                        JwtRegisteredClaimNames.Email
                    )?.Value
                    ??
                    User.FindFirst("email")?.Value;

                if (string.IsNullOrWhiteSpace(email))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Email claim not found in token."
                    });
                }

                var user =
                    await _authService
                        .GetCurrentUserAsync(email);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message =
                            "User not found."
                    });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // UPDATE PROFILE
        // PUT /api/Auth/profile
        // =====================================================

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateProfileDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Profile data is required."
                    });
                }

                var userId = GetCurrentUserId();

                if (userId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "User ID not found in token."
                    });
                }

                var user =
                    await _authService
                        .UpdateProfileAsync(
                            userId.Value,
                            dto
                        );

                if (user == null)
                {
                    return NotFound(new
                    {
                        message =
                            "User not found."
                    });
                }

                // =================================================
                // AUDIT
                // =================================================

                await SafeAuditAsync(
                    userId: userId.Value.ToString(),
                    userName: GetClaimName() ?? "User",
                    action: "Update Profile",
                    category: "Account",
                    target: "User Profile",
                    description:
                        "User profile updated successfully.",
                    status: "Success"
                );

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // CHANGE PASSWORD
        // PUT /api/Auth/password
        // =====================================================

        [Authorize]
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Password data is required."
                    });
                }

                var userId = GetCurrentUserId();

                if (userId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "User ID not found in token."
                    });
                }

                var result =
                    await _authService
                        .ChangePasswordAsync(
                            userId.Value,
                            dto
                        );

                if (!result)
                {
                    await SafeAuditAsync(
                        userId.Value.ToString(),
                        GetClaimName() ?? "User",
                        "Change Password Failed",
                        "Security",
                        "User Account",
                        "Password change failed.",
                        "Failed"
                    );

                    return BadRequest(new
                    {
                        message =
                            "Password could not be changed."
                    });
                }

                // =================================================
                // AUDIT
                // =================================================

                await SafeAuditAsync(
                    userId.Value.ToString(),
                    GetClaimName() ?? "User",
                    "Change Password",
                    "Security",
                    "User Account",
                    "User password changed successfully.",
                    "Success"
                );

                return Ok(new
                {
                    message =
                        "Password updated successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // =====================================================
        // ADMIN
        // GET /api/Auth/admin
        // =====================================================

        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public async Task<IActionResult> AdminOnly()
        {
            await SafeAuditAsync(
                GetCurrentUserId()?.ToString(),
                GetClaimName() ?? "Admin",
                "Access Admin Area",
                "Authorization",
                "Admin Dashboard",
                "Administrator accessed the admin area.",
                "Success"
            );

            return Ok(new
            {
                message = "Bienvenue Admin 👑",
                role = "Admin"
            });
        }

        // =====================================================
        // MANAGER
        // =====================================================

        [Authorize(Roles = "Manager")]
        [HttpGet("manager")]
        public IActionResult ManagerOnly()
        {
            return Ok(new
            {
                message = "Bienvenue Manager 👨‍💼",
                role = "Manager"
            });
        }

        // =====================================================
        // EMPLOYEE
        // =====================================================

        [Authorize(Roles = "Employee")]
        [HttpGet("employee")]
        public IActionResult EmployeeOnly()
        {
            return Ok(new
            {
                message = "Bienvenue Employee 👨‍🎓",
                role = "Employee"
            });
        }

        // =====================================================
        // ENSEIGNANT
        // =====================================================

        [Authorize(Roles = "Enseignant")]
        [HttpGet("enseignant")]
        public IActionResult EnseignantOnly()
        {
            return Ok(new
            {
                message = "Bienvenue Enseignant 👨‍🏫",
                role = "Enseignant"
            });
        }

        // =====================================================
        // ÉTUDIANT
        // =====================================================

        [Authorize(Roles = "Étudiant")]
        [HttpGet("etudiant")]
        public IActionResult EtudiantOnly()
        {
            return Ok(new
            {
                message = "Bienvenue Étudiant 🎓",
                role = "Étudiant"
            });
        }

        // =====================================================
        // MANAGEMENT
        // =====================================================

        [Authorize(Roles = "Admin,Manager")]
        [HttpGet("management")]
        public IActionResult Management()
        {
            return Ok(new
            {
                message =
                    "Access granted to management.",

                role =
                    User.FindFirst(
                        ClaimTypes.Role
                    )?.Value
            });
        }

        // =====================================================
        // CURRENT USER ID
        // =====================================================

        private Guid? GetCurrentUserId()
        {
            var value =
                User.FindFirst(
                    ClaimTypes.NameIdentifier
                )?.Value
                ??
                User.FindFirst(
                    JwtRegisteredClaimNames.Sub
                )?.Value
                ??
                User.FindFirst("sub")?.Value;

            if (Guid.TryParse(value, out var id))
            {
                return id;
            }

            return null;
        }

        // =====================================================
        // CURRENT USER NAME
        // =====================================================

        private string? GetClaimName()
        {
            return
                User.FindFirst(ClaimTypes.Name)?.Value
                ??
                User.FindFirst("name")?.Value
                ??
                User.FindFirst(
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                )?.Value;
        }

        // =====================================================
        // TOKEN USER INFO
        // =====================================================

        private (
            string? UserId,
            string? UserName
        ) GetUserInfoFromToken(string token)
        {
            try
            {
                var handler =
                    new JwtSecurityTokenHandler();

                var jwt =
                    handler.ReadJwtToken(token);

                var userId =
                    jwt.Claims.FirstOrDefault(
                        c =>
                            c.Type ==
                            ClaimTypes.NameIdentifier
                            ||
                            c.Type ==
                            JwtRegisteredClaimNames.Sub
                            ||
                            c.Type == "sub"
                    )?.Value;

                var userName =
                    jwt.Claims.FirstOrDefault(
                        c =>
                            c.Type == ClaimTypes.Name
                            ||
                            c.Type == "name"
                    )?.Value;

                return (
                    userId,
                    userName
                );
            }
            catch
            {
                return (null, null);
            }
        }

        // =====================================================
        // SAFE AUDIT
        // Audit failure must NEVER break the main operation
        // =====================================================

        private async Task SafeAuditAsync(
            string? userId,
            string userName,
            string action,
            string category,
            string target,
            string description,
            string status)
        {
            try
            {
                await _auditLogService.CreateAsync(
                    userId,
                    userName,
                    action,
                    category,
                    target,
                    description,
                    status,
                    HttpContext.Connection
                        .RemoteIpAddress?
                        .ToString(),
                    Request.Headers.UserAgent
                        .ToString()
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Audit log failed: {ex.Message}"
                );
            }
        }
    }
}