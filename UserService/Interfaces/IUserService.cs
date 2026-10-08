using UserService.DTOs;

namespace UserService.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserProfileDto>> GetAllAsync();

        Task<UserProfileDto?> GetByIdAsync(Guid id);

        Task<UserProfileDto?> GetByUserIdAsync(Guid userId);

        Task<UserProfileDto> CreateAsync(CreateUserProfileDto dto);

        Task<UserProfileDto> UpdateAsync(Guid id, UpdateUserProfileDto dto);

        Task DeleteAsync(Guid id);
    }
}