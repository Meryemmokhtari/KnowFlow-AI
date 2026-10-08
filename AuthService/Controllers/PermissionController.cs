using AuthService.Data;
using AuthService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/Permission
        // Get all permissions
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description
                })
                .ToListAsync();

            return Ok(permissions);
        }

        // =====================================================
        // GET: api/Permission/5
        // Get permission by ID
        // =====================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPermission(int id)
        {
            var permission = await _context.Permissions
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,

                    Roles = p.RolePermissions
                        .Select(rp => new
                        {
                            rp.Role.Id,
                            rp.Role.Name
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (permission == null)
            {
                return NotFound(new
                {
                    message = "Permission not found."
                });
            }

            return Ok(permission);
        }

        // =====================================================
        // POST: api/Permission
        // Create permission
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> CreatePermission(
            [FromBody] CreatePermissionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Permission name is required."
                });
            }

            var name = request.Name.Trim();

            var exists = await _context.Permissions
                .AnyAsync(p => p.Name == name);

            if (exists)
            {
                return Conflict(new
                {
                    message =
                        "A permission with this name already exists."
                });
            }

            var permission = new Permission
            {
                Name = name,
                Description =
                    request.Description?.Trim() ?? string.Empty
            };

            _context.Permissions.Add(permission);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPermission),
                new { id = permission.Id },
                new
                {
                    permission.Id,
                    permission.Name,
                    permission.Description
                });
        }

        // =====================================================
        // PUT: api/Permission/5
        // Update permission
        // =====================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdatePermission(
            int id,
            [FromBody] UpdatePermissionRequest request)
        {
            var permission = await _context.Permissions
                .FirstOrDefaultAsync(p => p.Id == id);

            if (permission == null)
            {
                return NotFound(new
                {
                    message = "Permission not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Permission name is required."
                });
            }

            var name = request.Name.Trim();

            var duplicate = await _context.Permissions
                .AnyAsync(p =>
                    p.Id != id &&
                    p.Name == name);

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "A permission with this name already exists."
                });
            }

            permission.Name = name;

            permission.Description =
                request.Description?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Permission updated successfully.",

                permission.Id,
                permission.Name,
                permission.Description
            });
        }

        // =====================================================
        // DELETE: api/Permission/5
        // Delete permission
        // =====================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeletePermission(
            int id)
        {
            var permission = await _context.Permissions
                .Include(p => p.RolePermissions)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (permission == null)
            {
                return NotFound(new
                {
                    message = "Permission not found."
                });
            }

            // Remove role associations first

            if (permission.RolePermissions.Any())
            {
                _context.RolePermissions.RemoveRange(
                    permission.RolePermissions);
            }

            _context.Permissions.Remove(permission);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Permission deleted successfully."
            });
        }
    }


    // =========================================================
    // REQUEST MODELS
    // =========================================================

    public class CreatePermissionRequest
    {
        public string Name { get; set; }
            = string.Empty;

        public string? Description { get; set; }
    }

    public class UpdatePermissionRequest
    {
        public string Name { get; set; }
            = string.Empty;

        public string? Description { get; set; }
    }
}