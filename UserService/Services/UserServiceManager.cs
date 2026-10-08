using UserService.DTOs;
using UserService.Interfaces;
using UserService.Models;

namespace UserService.Services
{
    public class UserServiceManager : IUserService
    {
        private readonly IUserRepository _repository;

        public UserServiceManager(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<UserProfileDto>> GetAllAsync()
        {
            var users = await _repository.GetAllAsync();

            return users.Select(x => new UserProfileDto
            {
                Id = x.Id,
                UserId = x.UserId,
                FirstName = x.FirstName,
                LastName = x.LastName,
                Phone = x.Phone,
                Department = x.Department,
                JobTitle = x.JobTitle,
                ProfileImage = x.ProfileImage,
                Bio = x.Bio
            });
        }

        public async Task<UserProfileDto?> GetByIdAsync(Guid id)
        {
            var user = await _repository.GetByIdAsync(id);

            if (user == null)
                return null;

            return new UserProfileDto
            {
                Id = user.Id,
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Department = user.Department,
                JobTitle = user.JobTitle,
                ProfileImage = user.ProfileImage,
                Bio = user.Bio
            };
        }

        public async Task<UserProfileDto?> GetByUserIdAsync(Guid userId)
        {
            var user = await _repository.GetByUserIdAsync(userId);

            if (user == null)
                return null;

            return new UserProfileDto
            {
                Id = user.Id,
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Department = user.Department,
                JobTitle = user.JobTitle,
                ProfileImage = user.ProfileImage,
                Bio = user.Bio
            };
        }

        public async Task<UserProfileDto> CreateAsync(CreateUserProfileDto dto)
        {
            var profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Phone = dto.Phone,
                Department = dto.Department,
                JobTitle = dto.JobTitle,
                ProfileImage = dto.ProfileImage,
                Bio = dto.Bio,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(profile);
            await _repository.SaveChangesAsync();

            return await GetByIdAsync(profile.Id) ?? throw new Exception("Profile not found.");
        }

        public async Task<UserProfileDto> UpdateAsync(Guid id, UpdateUserProfileDto dto)
        {
            var profile = await _repository.GetByIdAsync(id);

            if (profile == null)
                throw new Exception("Profile not found.");

            profile.FirstName = dto.FirstName ?? profile.FirstName;
            profile.LastName = dto.LastName ?? profile.LastName;
            profile.Phone = dto.Phone;
            profile.Department = dto.Department;
            profile.JobTitle = dto.JobTitle;
            profile.ProfileImage = dto.ProfileImage;
            profile.Bio = dto.Bio;
            profile.UpdatedAt = DateTime.UtcNow;

            _repository.Update(profile);
            await _repository.SaveChangesAsync();

            return await GetByIdAsync(id) ?? throw new Exception("Profile not found.");
        }

        public async Task DeleteAsync(Guid id)
        {
            var profile = await _repository.GetByIdAsync(id);

            if (profile == null)
                throw new Exception("Profile not found.");

            _repository.Delete(profile);
            await _repository.SaveChangesAsync();
        }
    }
}