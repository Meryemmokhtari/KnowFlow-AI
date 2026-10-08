using AuthService.DTOs;

namespace AuthService.Interfaces
{
    public interface IAuthService
    {
        Task<UserDto> RegisterAsync(RegisterDto registerDto);

        Task<string> LoginAsync(LoginDto loginDto);

        Task<UserDto?> GetCurrentUserAsync(string email);

        Task<UserDto?> UpdateProfileAsync(
            Guid userId,
            UpdateProfileDto updateProfileDto
        );

        Task<bool> ChangePasswordAsync(
            Guid userId,
            ChangePasswordDto changePasswordDto
        );

        Task<List<UserDto>> GetAllUsersAsync();

        Task<bool> ChangeUserRoleAsync(
            Guid userId,
            int roleId
        );

        Task<bool> ChangeUserStatusAsync(
            Guid userId,
            bool isActive
        );

        Task<bool> DeleteUserAsync(
            Guid userId
        );
    }
}