using System.ComponentModel.DataAnnotations;

namespace UserService.DTOs
{
    public class CreateUserProfileDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Department { get; set; }

        public string? JobTitle { get; set; }

        public string? ProfileImage { get; set; }

        public string? Bio { get; set; }
    }
}