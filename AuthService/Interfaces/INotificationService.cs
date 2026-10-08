
using AuthService.DTOs;

namespace AuthService.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetUserNotificationsAsync(
            Guid userId
        );

        Task<bool> MarkAsReadAsync(
            Guid notificationId,
            Guid userId
        );

        Task<bool> MarkAllAsReadAsync(
            Guid userId
        );

        Task<NotificationDto> CreateAsync(
            Guid userId,
            string title,
            string message,
            string type = "info"
        );
    }
}