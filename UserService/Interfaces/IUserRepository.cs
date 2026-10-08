using UserService.Models;

namespace UserService.Interfaces
{
    public interface IUserRepository
    {
        Task<IEnumerable<UserProfile>> GetAllAsync();

        Task<UserProfile?> GetByIdAsync(Guid id);

        Task<UserProfile?> GetByUserIdAsync(Guid userId);

        Task AddAsync(UserProfile profile);

        void Update(UserProfile profile);

        void Delete(UserProfile profile);

        Task SaveChangesAsync();
    }
}