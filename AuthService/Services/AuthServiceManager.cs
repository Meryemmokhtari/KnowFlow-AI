
using AuthService.DTOs;
using AuthService.Interfaces;
using AuthService.Models;

using Microsoft.AspNetCore.Http;

namespace AuthService.Services
{
    public class AuthServiceManager : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IAuditLogService _auditLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthServiceManager(
            IUserRepository userRepository,
            IJwtService jwtService,
            IAuditLogService auditLogService,
            IHttpContextAccessor httpContextAccessor)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _auditLogService = auditLogService;
            _httpContextAccessor = httpContextAccessor;
        }

        // =====================================================
        // REGISTER
        // =====================================================

        public async Task<UserDto> RegisterAsync(
            RegisterDto registerDto)
        {
            if (registerDto == null)
                throw new Exception(
                    "Registration data is required."
                );

            if (string.IsNullOrWhiteSpace(registerDto.FirstName))
                throw new Exception(
                    "First name is required."
                );

            if (string.IsNullOrWhiteSpace(registerDto.LastName))
                throw new Exception(
                    "Last name is required."
                );

            if (string.IsNullOrWhiteSpace(registerDto.Email))
                throw new Exception(
                    "Email is required."
                );

            if (string.IsNullOrWhiteSpace(registerDto.Password))
                throw new Exception(
                    "Password is required."
                );

            if (registerDto.Password.Length < 8)
                throw new Exception(
                    "Password must contain at least 8 characters."
                );

            var email =
                registerDto.Email
                    .Trim()
                    .ToLowerInvariant();

            if (await _userRepository.EmailExistsAsync(email))
                throw new Exception(
                    "Email already exists."
                );

            var user = new User
            {
                Id = Guid.NewGuid(),

                FirstName =
                    registerDto.FirstName.Trim(),

                LastName =
                    registerDto.LastName.Trim(),

                Email = email,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        registerDto.Password
                    ),

                RoleId = registerDto.RoleId,

                IsActive = true,

                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            await _userRepository.SaveChangesAsync();

            var createdUser =
                await _userRepository.GetByIdAsync(user.Id);

            if (createdUser == null)
            {
                throw new Exception(
                    "User could not be loaded after registration."
                );
            }

            // Audit is handled by AuthController.
            return MapToUserDto(createdUser);
        }

        // =====================================================
        // LOGIN
        // =====================================================

        public async Task<string> LoginAsync(
            LoginDto loginDto)
        {
            if (loginDto == null)
            {
                throw new Exception(
                    "Login data is required."
                );
            }

            if (string.IsNullOrWhiteSpace(loginDto.Email))
            {
                throw new Exception(
                    "Email is required."
                );
            }

            if (string.IsNullOrWhiteSpace(loginDto.Password))
            {
                throw new Exception(
                    "Password is required."
                );
            }

            var email =
                loginDto.Email
                    .Trim()
                    .ToLowerInvariant();

            var user =
                await _userRepository.GetByEmailAsync(email);

            // =================================================
            // DEBUG LOGIN USER
            // =================================================

            Console.WriteLine("======================================");
            Console.WriteLine("LOGIN USER DEBUG");
            Console.WriteLine($"Email      : {email}");
            Console.WriteLine($"User found : {user != null}");

            if (user != null)
            {
                Console.WriteLine($"User ID    : {user.Id}");
                Console.WriteLine($"FirstName  : {user.FirstName}");
                Console.WriteLine($"LastName   : {user.LastName}");
                Console.WriteLine($"RoleId     : {user.RoleId}");
            }

            Console.WriteLine("======================================");

            // =================================================
            // LOGIN FAILED - USER NOT FOUND
            // =================================================

            if (user == null)
            {
                throw new Exception(
                    "Invalid email or password."
                );
            }

            // =================================================
            // LOGIN FAILED - INACTIVE ACCOUNT
            // =================================================

            if (!user.IsActive)
            {
                throw new Exception(
                    "This account is inactive."
                );
            }

            // =================================================
            // VERIFY PASSWORD
            // =================================================

            var validPassword =
                BCrypt.Net.BCrypt.Verify(
                    loginDto.Password,
                    user.PasswordHash
                );

            // =================================================
            // LOGIN FAILED - WRONG PASSWORD
            // =================================================

            if (!validPassword)
            {
                throw new Exception(
                    "Invalid email or password."
                );
            }

            // =================================================
            // GENERATE TOKEN
            // =================================================

            Console.WriteLine("======================================");
            Console.WriteLine("JWT GENERATION DEBUG");
            Console.WriteLine($"User ID sent to JwtService: {user.Id}");
            Console.WriteLine("======================================");

            var token =
                _jwtService.GenerateToken(user);

            // Audit is handled by AuthController.
            return token;
        }

        // =====================================================
        // CURRENT USER
        // =====================================================

        public async Task<UserDto?> GetCurrentUserAsync(
            string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            var normalizedEmail =
                email
                    .Trim()
                    .ToLowerInvariant();

            var user =
                await _userRepository.GetByEmailAsync(
                    normalizedEmail
                );

            if (user == null)
                return null;

            return MapToUserDto(user);
        }

        // =====================================================
        // UPDATE PROFILE
        // =====================================================

        public async Task<UserDto?> UpdateProfileAsync(
            Guid userId,
            UpdateProfileDto updateProfileDto)
        {
            if (updateProfileDto == null)
            {
                throw new Exception(
                    "Profile data is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                updateProfileDto.FirstName))
            {
                throw new Exception(
                    "First name is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                updateProfileDto.LastName))
            {
                throw new Exception(
                    "Last name is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                updateProfileDto.Email))
            {
                throw new Exception(
                    "Email is required."
                );
            }

            var user =
                await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return null;

            var newEmail =
                updateProfileDto.Email
                    .Trim()
                    .ToLowerInvariant();

            if (!string.Equals(
                user.Email,
                newEmail,
                StringComparison.OrdinalIgnoreCase))
            {
                if (await _userRepository.EmailExistsAsync(
                    newEmail))
                {
                    throw new Exception(
                        "Email already exists."
                    );
                }
            }

            user.FirstName =
                updateProfileDto.FirstName.Trim();

            user.LastName =
                updateProfileDto.LastName.Trim();

            user.Email = newEmail;

            await _userRepository.UpdateAsync(user);

            await _userRepository.SaveChangesAsync();

            var updatedUser =
                await _userRepository.GetByIdAsync(user.Id);

            // Audit is handled by AuthController.

            return updatedUser == null
                ? null
                : MapToUserDto(updatedUser);
        }

        // =====================================================
        // CHANGE PASSWORD
        // =====================================================

        public async Task<bool> ChangePasswordAsync(
            Guid userId,
            ChangePasswordDto changePasswordDto)
        {
            if (changePasswordDto == null)
            {
                throw new Exception(
                    "Password data is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                changePasswordDto.CurrentPassword))
            {
                throw new Exception(
                    "Current password is required."
                );
            }

            if (string.IsNullOrWhiteSpace(
                changePasswordDto.NewPassword))
            {
                throw new Exception(
                    "New password is required."
                );
            }

            if (changePasswordDto.NewPassword.Length < 6)
            {
                throw new Exception(
                    "New password must contain at least 6 characters."
                );
            }

            if (changePasswordDto.NewPassword !=
                changePasswordDto.ConfirmPassword)
            {
                throw new Exception(
                    "New password and confirmation do not match."
                );
            }

            var user =
                await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new Exception(
                    "User not found."
                );
            }

            var validCurrentPassword =
                BCrypt.Net.BCrypt.Verify(
                    changePasswordDto.CurrentPassword,
                    user.PasswordHash
                );

            if (!validCurrentPassword)
            {
                throw new Exception(
                    "Current password is incorrect."
                );
            }

            var samePassword =
                BCrypt.Net.BCrypt.Verify(
                    changePasswordDto.NewPassword,
                    user.PasswordHash
                );

            if (samePassword)
            {
                throw new Exception(
                    "New password must be different from the current password."
                );
            }

            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    changePasswordDto.NewPassword
                );

            await _userRepository.UpdateAsync(user);

            await _userRepository.SaveChangesAsync();

            // Audit is handled by AuthController.

            return true;
        }

        // =====================================================
        // GET ALL USERS
        // =====================================================

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users =
                await _userRepository.GetAllAsync();

            return users
                .Select(MapToUserDto)
                .ToList();
        }

        // =====================================================
        // CHANGE USER ROLE
        // =====================================================

        public async Task<bool> ChangeUserRoleAsync(
            Guid userId,
            int roleId)
        {
            if (roleId <= 0)
            {
                throw new Exception(
                    "Invalid role."
                );
            }

            var user =
                await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return false;

            var oldRoleId =
                user.RoleId;

            user.RoleId = roleId;

            await _userRepository.UpdateAsync(user);

            await _userRepository.SaveChangesAsync();

            await WriteAuditAsync(
                user.Id.ToString(),
                $"{user.FirstName} {user.LastName}",
                "Change Role",
                "User Management",
                "AuthService",
                $"User role changed from {oldRoleId} to {roleId}.",
                "Success"
            );

            return true;
        }

        // =====================================================
        // CHANGE USER STATUS
        // =====================================================

        public async Task<bool> ChangeUserStatusAsync(
            Guid userId,
            bool isActive)
        {
            var user =
                await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return false;

            user.IsActive = isActive;

            await _userRepository.UpdateAsync(user);

            await _userRepository.SaveChangesAsync();

            await WriteAuditAsync(
                user.Id.ToString(),
                $"{user.FirstName} {user.LastName}",
                "Change Status",
                "User Management",
                "AuthService",
                $"User account status changed to {(isActive ? "Active" : "Inactive")}.",
                "Success"
            );

            return true;
        }

        // =====================================================
        // DELETE USER
        // =====================================================

        public async Task<bool> DeleteUserAsync(
            Guid userId)
        {
            var user =
                await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return false;

            var userName =
                $"{user.FirstName} {user.LastName}";

            await _userRepository.DeleteAsync(user);

            await _userRepository.SaveChangesAsync();

            await WriteAuditAsync(
                user.Id.ToString(),
                userName,
                "Delete User",
                "User Management",
                "AuthService",
                "User deleted successfully.",
                "Success"
            );

            return true;
        }

        // =====================================================
        // AUDIT HELPER
        // =====================================================

        private async Task WriteAuditAsync(
            string? userId,
            string userName,
            string action,
            string category,
            string target,
            string description,
            string status)
        {
            try
            {
                var httpContext =
                    _httpContextAccessor.HttpContext;

                var ipAddress =
                    httpContext?
                        .Connection
                        .RemoteIpAddress?
                        .ToString();

                var userAgent =
                    httpContext?
                        .Request
                        .Headers
                        .UserAgent
                        .ToString();

                await _auditLogService.CreateAsync(
                    userId,
                    userName,
                    action,
                    category,
                    target,
                    description,
                    status,
                    ipAddress,
                    userAgent
                );
            }
            catch (Exception ex)
            {
                // Audit failure must never break
                // the main business operation.
                Console.WriteLine(
                    "AUDIT LOG ERROR: " +
                    ex.Message
                );
            }
        }

        // =====================================================
        // MAP USER → DTO
        // =====================================================

        private static UserDto MapToUserDto(
            User user)
        {
            return new UserDto
            {
                Id = user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Email =
                    user.Email,

                Role =
                    user.Role?.Name ?? "Unknown",

                RoleId =
                    user.RoleId,

                IsActive =
                    user.IsActive,

                CreatedAt =
                    user.CreatedAt
            };
        }
    }
}

