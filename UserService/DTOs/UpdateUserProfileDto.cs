namespace UserService.DTOs
{
    public class UpdateUserProfileDto
    {
        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public string? Phone { get; set; }

        public string? Department { get; set; }

        public string? JobTitle { get; set; }

        public string? ProfileImage { get; set; }

        public string? Bio { get; set; }
    }
}