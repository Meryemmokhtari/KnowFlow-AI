
using AuthService.Data;
using AuthService.Interfaces;
using AuthService.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ApplicationDbContext _context;

        public AdminController(
            IUserRepository userRepository,
            ApplicationDbContext context)
        {
            _userRepository = userRepository;
            _context = context;
        }

        // =====================================================
        // GET ALL USERS
        // GET /api/Admin/users
        // =====================================================

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users =
                    await _userRepository.GetAllAsync();

                var result = users
                    .Select(user => new
                    {
                        id = user.Id,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        roleId = user.RoleId,
                        role = user.Role?.Name ?? "Unknown",
                        isActive = user.IsActive,
                        createdAt = user.CreatedAt
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to load users.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET USER BY ID
        // GET /api/Admin/users/{id}
        // =====================================================

        [HttpGet("users/{id:guid}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            try
            {
                var user =
                    await _userRepository.GetByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                return Ok(new
                {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    roleId = user.RoleId,
                    role = user.Role?.Name ?? "Unknown",
                    isActive = user.IsActive,
                    createdAt = user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to load user.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET ROLES
        // GET /api/Admin/roles
        // =====================================================

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles =
                    await _context.Roles
                        .AsNoTracking()
                        .OrderBy(r => r.Id)
                        .Select(r => new
                        {
                            id = r.Id,
                            name = r.Name
                        })
                        .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to load roles.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // CHANGE USER ROLE
        // PUT /api/Admin/users/{id}/role
        // =====================================================

        [HttpPut("users/{id:guid}/role")]
        public async Task<IActionResult> ChangeRole(
            Guid id,
            [FromBody] ChangeRoleRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message = "Role data is required."
                    });
                }

                var user =
                    await _userRepository.GetByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                var role =
                    await _context.Roles
                        .FirstOrDefaultAsync(
                            r => r.Id == request.RoleId
                        );

                if (role == null)
                {
                    return BadRequest(new
                    {
                        message = "Role not found."
                    });
                }

                var oldRole =
                    user.Role?.Name ?? "Unknown";

                user.RoleId = role.Id;
                user.Role = role;

                await _userRepository.UpdateAsync(user);
                await _userRepository.SaveChangesAsync();

                await CreateAuditLog(
                    "ROLE_CHANGED",
                    "User Management",
                    user.Email,
                    $"User role changed from {oldRole} to {role.Name}.",
                    "Success"
                );

                return Ok(new
                {
                    message =
                        "User role updated successfully.",

                    userId = user.Id,

                    roleId = role.Id,

                    role = role.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to change user role.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // ACTIVATE / DEACTIVATE USER
        // PUT /api/Admin/users/{id}/status
        // =====================================================

        [HttpPut("users/{id:guid}/status")]
        public async Task<IActionResult> ChangeStatus(
            Guid id,
            [FromBody] ChangeStatusRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message = "Status data is required."
                    });
                }

                var user =
                    await _userRepository.GetByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                user.IsActive =
                    request.IsActive;

                await _userRepository.UpdateAsync(user);
                await _userRepository.SaveChangesAsync();

                var action =
                    request.IsActive
                        ? "USER_ACTIVATED"
                        : "USER_DEACTIVATED";

                var description =
                    request.IsActive
                        ? $"User {user.Email} was activated."
                        : $"User {user.Email} was deactivated.";

                await CreateAuditLog(
                    action,
                    "User Management",
                    user.Email,
                    description,
                    "Success"
                );

                return Ok(new
                {
                    message =
                        request.IsActive
                            ? "User activated successfully."
                            : "User deactivated successfully.",

                    userId = user.Id,

                    isActive = user.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to change user status.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // DELETE USER
        // DELETE /api/Admin/users/{id}
        // =====================================================

        [HttpDelete("users/{id:guid}")]
        public async Task<IActionResult> DeleteUser(
            Guid id)
        {
            try
            {
                var user =
                    await _userRepository.GetByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                var email = user.Email;

                await _userRepository.DeleteAsync(user);
                await _userRepository.SaveChangesAsync();

                await CreateAuditLog(
                    "USER_DELETED",
                    "User Management",
                    email,
                    $"User {email} was deleted.",
                    "Success"
                );

                return Ok(new
                {
                    message =
                        "User deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to delete user.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // ADMIN DASHBOARD STATS
        // GET /api/Admin/stats
        // =====================================================

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalUsers =
                    await _context.Users.CountAsync();

                var activeUsers =
                    await _context.Users
                        .CountAsync(
                            u => u.IsActive
                        );

                var auditLogs =
                    await _context.AuditLogs
                        .CountAsync();

                var notifications =
                    await _context.Notifications
                        .CountAsync();

                /*
                 * DocumentService, SearchService and AIService
                 * are separate microservices.
                 *
                 * Therefore AuthService must NOT use:
                 *
                 * DbSet<Document>
                 *
                 * or:
                 *
                 * _context.Documents
                 *
                 * here.
                 *
                 * These values will be connected to their
                 * respective microservices later.
                 */

                return Ok(new
                {
                    users = totalUsers,

                    totalUsers = totalUsers,

                    activeUsers = activeUsers,

                    documents = 0,

                    totalDocuments = 0,

                    aiQueries = 0,

                    totalAiQueries = 0,

                    searches = 0,

                    totalSearches = 0,

                    uploads = 0,

                    totalUploads = 0,

                    auditLogs = auditLogs,

                    notifications = notifications
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load dashboard statistics.",

                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // ADMIN DASHBOARD ACTIVITY
        // GET /api/Admin/activity
        // =====================================================

        [HttpGet("activity")]
        public async Task<IActionResult> GetActivity()
        {
            try
            {
                var logs =
                    await _context.AuditLogs
                        .AsNoTracking()
                        .OrderByDescending(
                            x => x.Timestamp
                        )
                        .Take(20)
                        .Select(x => new
                        {
                            id = x.Id,

                            userId = x.UserId,

                            userName = x.UserName,

                            action = x.Action,

                            category = x.Category,

                            target = x.Target,

                            description =
                                x.Description,

                            status = x.Status,

                            createdAt =
                                x.Timestamp
                        })
                        .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load recent activity.",

                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // CREATE AUDIT LOG
        // INTERNAL METHOD
        // =====================================================

        private async Task CreateAuditLog(
            string action,
            string category,
            string target,
            string description,
            string status)
        {
            try
            {
                var userName =
                    User.FindFirst(
                        ClaimTypes.Name
                    )?.Value
                    ??
                    User.FindFirst(
                        "name"
                    )?.Value
                    ??
                    "System";

                var userId =
                    User.FindFirst(
                        ClaimTypes.NameIdentifier
                    )?.Value
                    ??
                    User.FindFirst(
                        "sub"
                    )?.Value;

                var ipAddress =
                    HttpContext.Connection
                        .RemoteIpAddress?
                        .ToString();

                var userAgent =
                    Request.Headers
                        .UserAgent
                        .ToString();

                var auditLog = new AuditLog
                {
                    UserId =
                        string.IsNullOrWhiteSpace(userId)
                            ? null
                            : userId,

                    UserName =
                        string.IsNullOrWhiteSpace(userName)
                            ? "System"
                            : userName,

                    Action =
                        string.IsNullOrWhiteSpace(action)
                            ? "Unknown"
                            : action,

                    Category =
                        string.IsNullOrWhiteSpace(category)
                            ? "System"
                            : category,

                    Target =
                        string.IsNullOrWhiteSpace(target)
                            ? "Unknown"
                            : target,

                    Description =
                        string.IsNullOrWhiteSpace(description)
                            ? string.Empty
                            : description,

                    Status =
                        string.IsNullOrWhiteSpace(status)
                            ? "Success"
                            : status,

                    Timestamp =
                        DateTime.UtcNow,

                    IpAddress =
                        string.IsNullOrWhiteSpace(ipAddress)
                            ? null
                            : ipAddress,

                    UserAgent =
                        string.IsNullOrWhiteSpace(userAgent)
                            ? null
                            : userAgent
                };

                _context.AuditLogs.Add(auditLog);

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                /*
                 * Audit log failure must not break
                 * the main admin operation.
                 */

                Console.WriteLine(
                    "Audit log error: " +
                    ex.Message
                );
            }
        }
    }

    // =========================================================
    // REQUEST DTOs
    // =========================================================

    public class ChangeRoleRequest
    {
        public int RoleId { get; set; }
    }

    public class ChangeStatusRequest
    {
        public bool IsActive { get; set; }
    }
}