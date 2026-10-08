namespace UserService.DTOs
{
    public class UserProfileDto
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Department { get; set; }

        public string? JobTitle { get; set; }

        public string? ProfileImage { get; set; }

        public string? Bio { get; set; }
    }
}