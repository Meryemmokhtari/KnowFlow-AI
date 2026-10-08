
using AuthService.Models;

namespace AuthService.Interfaces
{
    public interface IAuditLogService
    {
        Task<List<AuditLog>> GetAllAsync();

        Task<List<AuditLog>> GetByUserIdAsync(string userId);

        Task<AuditLog?> GetByIdAsync(int id);

        Task<AuditLog> CreateAsync(
            string? userId,
            string userName,
            string action,
            string category,
            string target,
            string description,
            string status,
            string? ipAddress,
            string? userAgent
        );
    }
}