
using AuthService.Data;
using AuthService.Interfaces;
using AuthService.Models;

using Microsoft.EntityFrameworkCore;

namespace AuthService.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET ALL
        // =====================================================

        public async Task<List<AuditLog>> GetAllAsync()
        {
            return await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        // =====================================================
        // GET BY USER
        // =====================================================

        public async Task<List<AuditLog>> GetByUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return new List<AuditLog>();
            }

            userId = userId.Trim();

            return await _context.AuditLogs
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        // =====================================================
        // GET BY ID
        // =====================================================

        public async Task<AuditLog?> GetByIdAsync(int id)
        {
            return await _context.AuditLogs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        // =====================================================
        // CREATE
        // =====================================================

        public async Task<AuditLog> CreateAsync(
            string? userId,
            string userName,
            string action,
            string category,
            string target,
            string description,
            string status,
            string? ipAddress,
            string? userAgent)
        {
            var auditLog = new AuditLog
            {
                UserId = string.IsNullOrWhiteSpace(userId)
                    ? null
                    : userId.Trim(),

                UserName = string.IsNullOrWhiteSpace(userName)
                    ? "System"
                    : userName.Trim(),

                Action = string.IsNullOrWhiteSpace(action)
                    ? "Unknown"
                    : action.Trim(),

                Category = string.IsNullOrWhiteSpace(category)
                    ? "System"
                    : category.Trim(),

                Target = string.IsNullOrWhiteSpace(target)
                    ? "Unknown"
                    : target.Trim(),

                Description = string.IsNullOrWhiteSpace(description)
                    ? string.Empty
                    : description.Trim(),

                Status = string.IsNullOrWhiteSpace(status)
                    ? "Success"
                    : status.Trim(),

                Timestamp = DateTime.UtcNow,

                IpAddress = string.IsNullOrWhiteSpace(ipAddress)
                    ? null
                    : ipAddress.Trim(),

                UserAgent = string.IsNullOrWhiteSpace(userAgent)
                    ? null
                    : userAgent.Trim()
            };

            await _context.AuditLogs.AddAsync(auditLog);

            await _context.SaveChangesAsync();

            return auditLog;
        }
    }
}
