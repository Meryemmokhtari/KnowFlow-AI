
using AuthService.Data;
using AuthService.DTOs;
using AuthService.Interfaces;
using AuthService.Models;

using Microsoft.EntityFrameworkCore;

namespace AuthService.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;

        public NotificationService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET USER NOTIFICATIONS
        // =====================================================

        public async Task<List<NotificationDto>>
            GetUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();
        }

        // =====================================================
        // MARK ONE AS READ
        // =====================================================

        public async Task<bool> MarkAsReadAsync(
            Guid notificationId,
            Guid userId)
        {
            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(n =>
                        n.Id == notificationId &&
                        n.UserId == userId
                    );

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return true;
        }

        // =====================================================
        // MARK ALL AS READ
        // =====================================================

        public async Task<bool> MarkAllAsReadAsync(
            Guid userId)
        {
            var notifications =
                await _context.Notifications
                    .Where(n =>
                        n.UserId == userId &&
                        !n.IsRead
                    )
                    .ToListAsync();

            if (notifications.Count == 0)
            {
                return true;
            }

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return true;
        }

        // =====================================================
        // CREATE
        // =====================================================

        public async Task<NotificationDto> CreateAsync(
            Guid userId,
            string title,
            string message,
            string type = "info")
        {
            if (userId == Guid.Empty)
            {
                throw new ArgumentException(
                    "User ID is required."
                );
            }

            if (string.IsNullOrWhiteSpace(title))
            {
                throw new ArgumentException(
                    "Notification title is required."
                );
            }

            if (string.IsNullOrWhiteSpace(message))
            {
                throw new ArgumentException(
                    "Notification message is required."
                );
            }

            var notification = new Notification
            {
                Id = Guid.NewGuid(),

                UserId = userId,

                Title = title.Trim(),

                Message = message.Trim(),

                Type = string.IsNullOrWhiteSpace(type)
                    ? "info"
                    : type.Trim().ToLowerInvariant(),

                IsRead = false,

                CreatedAt = DateTime.UtcNow
            };

            await _context.Notifications.AddAsync(
                notification
            );

            await _context.SaveChangesAsync();

            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }
    }
}
