using AuthService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Manager")]
    public class ManagerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ManagerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET TEAM MEMBERS
        // GET /api/Manager/team
        // =====================================================

        [HttpGet("team")]
        public async Task<IActionResult> GetTeam()
        {
            try
            {
                var users = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Select(u => new
                    {
                        id = u.Id,
                        firstName = u.FirstName,
                        lastName = u.LastName,
                        email = u.Email,
                        roleId = u.RoleId,
                        role = u.Role != null
                            ? u.Role.Name
                            : "Unknown",
                        isActive = u.IsActive,
                        createdAt = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to load team members.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET TEAM STATS
        // GET /api/Manager/team/stats
        // =====================================================

        [HttpGet("team/stats")]
        public async Task<IActionResult> GetTeamStats()
        {
            try
            {
                var totalMembers =
                    await _context.Users.CountAsync();

                var activeMembers =
                    await _context.Users
                        .CountAsync(u => u.IsActive);

                var employees =
                    await _context.Users
                        .Include(u => u.Role)
                        .CountAsync(u =>
                            u.Role != null &&
                            (
                                u.Role.Name == "Employee" ||
                                u.Role.Name == "Employé"
                            )
                        );

                var managers =
                    await _context.Users
                        .Include(u => u.Role)
                        .CountAsync(u =>
                            u.Role != null &&
                            (
                                u.Role.Name == "Manager" ||
                                u.Role.Name == "Responsable"
                            )
                        );

                var enseignants =
                    await _context.Users
                        .Include(u => u.Role)
                        .CountAsync(u =>
                            u.Role != null &&
                            (
                                u.Role.Name == "Enseignant" ||
                                u.Role.Name == "Teacher"
                            )
                        );

                return Ok(new
                {
                    totalMembers,
                    activeMembers,
                    employees,
                    managers,
                    enseignants
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to load team statistics.",
                        error = ex.Message
                    }
                );
            }
        }
    }
}