namespace AuthService.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        // =====================================================
        // USER
        // =====================================================

        public string? UserId { get; set; }

        public string UserName { get; set; } = "System";

        // =====================================================
        // ACTION
        // =====================================================

        public string Action { get; set; } = string.Empty;

        public string Category { get; set; } = "System";

        public string Target { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        // =====================================================
        // STATUS
        // =====================================================

        public string Status { get; set; } = "Success";

        // =====================================================
        // DATE
        // =====================================================

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // =====================================================
        // TECHNICAL INFORMATION
        // =====================================================

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }
    }
}