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
    public class RoleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoleController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/Role
        // Get all roles
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .Select(r => new
                {
                    r.Id,
                    r.Name,

                    Members = r.Users.Count(),

                    Permissions = r.RolePermissions
                        .Select(rp => new
                        {
                            rp.Permission.Id,
                            rp.Permission.Name,
                            rp.Permission.Description
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(roles);
        }

        // =====================================================
        // GET: api/Role/5
        // Get role by ID
        // =====================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRole(int id)
        {
            var role = await _context.Roles
                .Include(r => r.Users)
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            return Ok(new
            {
                role.Id,
                role.Name,

                Members = role.Users.Count,

                Permissions = role.RolePermissions
                    .Select(rp => new
                    {
                        rp.Permission.Id,
                        rp.Permission.Name,
                        rp.Permission.Description
                    })
                    .ToList()
            });
        }

        // =====================================================
        // GET: api/Role/5/permissions
        // Get permissions of a role
        // =====================================================

        [HttpGet("{id:int}/permissions")]
        public async Task<IActionResult> GetRolePermissions(int id)
        {
            var roleExists = await _context.Roles
                .AnyAsync(r => r.Id == id);

            if (!roleExists)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            var permissions = await _context.RolePermissions
                .Where(rp => rp.RoleId == id)
                .Include(rp => rp.Permission)
                .Select(rp => new
                {
                    rp.Permission.Id,
                    rp.Permission.Name,
                    rp.Permission.Description
                })
                .ToListAsync();

            return Ok(permissions);
        }

        // =====================================================
        // PUT: api/Role/5/permissions
        // Update role permissions
        // =====================================================

        [HttpPut("{id:int}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(
            int id,
            [FromBody] UpdateRolePermissionsRequest request)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            if (request.PermissionIds == null)
            {
                return BadRequest(new
                {
                    message = "PermissionIds cannot be null."
                });
            }

            // Remove current permissions

            var currentPermissions = await _context.RolePermissions
                .Where(rp => rp.RoleId == id)
                .ToListAsync();

            _context.RolePermissions.RemoveRange(currentPermissions);

            // Add new permissions

            var permissionIds = request.PermissionIds
                .Distinct()
                .ToList();

            if (permissionIds.Count > 0)
            {
                var existingPermissionIds =
                    await _context.Permissions
                        .Where(p => permissionIds.Contains(p.Id))
                        .Select(p => p.Id)
                        .ToListAsync();

                var rolePermissions =
                    existingPermissionIds
                        .Select(permissionId =>
                            new RolePermission
                            {
                                RoleId = id,
                                PermissionId = permissionId
                            })
                        .ToList();

                await _context.RolePermissions
                    .AddRangeAsync(rolePermissions);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role permissions updated successfully.",
                roleId = role.Id,
                role = role.Name,
                permissionCount = permissionIds.Count
            });
        }

        // =====================================================
        // POST: api/Role
        // Create role
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> CreateRole(
            [FromBody] CreateRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Role name is required."
                });
            }

            var roleName = request.Name.Trim();

            var exists = await _context.Roles
                .AnyAsync(r => r.Name == roleName);

            if (exists)
            {
                return Conflict(new
                {
                    message = "A role with this name already exists."
                });
            }

            var role = new Role
            {
                Name = roleName
            };

            _context.Roles.Add(role);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRole),
                new { id = role.Id },
                new
                {
                    role.Id,
                    role.Name,
                    Members = 0,
                    Permissions = Array.Empty<object>()
                });
        }

        // =====================================================
        // PUT: api/Role/5
        // Update role
        // =====================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateRole(
            int id,
            [FromBody] UpdateRoleRequest request)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    message = "Role name is required."
                });
            }

            var roleName = request.Name.Trim();

            var duplicate = await _context.Roles
                .AnyAsync(r =>
                    r.Id != id &&
                    r.Name == roleName);

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "A role with this name already exists."
                });
            }

            role.Name = roleName;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role updated successfully.",
                role.Id,
                role.Name
            });
        }

        // =====================================================
        // DELETE: api/Role/5
        // Delete role
        // =====================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles
                .Include(r => r.Users)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            // Prevent deleting roles that still have users

            if (role.Users.Any())
            {
                return BadRequest(new
                {
                    message =
                        "This role cannot be deleted because users are assigned to it."
                });
            }

            // Prevent deleting Administrator

            if (role.Name.Equals(
                    "Administrator",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "The Administrator role is protected."
                });
            }

            _context.Roles.Remove(role);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role deleted successfully."
            });
        }
    }


    // =========================================================
    // REQUEST MODELS
    // =========================================================

    public class UpdateRolePermissionsRequest
    {
        public List<int> PermissionIds { get; set; }
            = new();
    }

    public class CreateRoleRequest
    {
        public string Name { get; set; }
            = string.Empty;
    }

    public class UpdateRoleRequest
    {
        public string Name { get; set; }
            = string.Empty;
    }
}