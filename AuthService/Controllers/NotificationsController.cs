
using AuthService.DTOs;
using AuthService.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;

        public NotificationsController(
            INotificationService notificationService,
            IConfiguration configuration)
        {
            _notificationService = notificationService;
            _configuration = configuration;
        }

        // =====================================================
        // GET USER NOTIFICATIONS
        // GET /api/Notifications
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User ID not found in token."
                });
            }

            var notifications =
                await _notificationService
                    .GetUserNotificationsAsync(userId.Value);

            return Ok(notifications);
        }

        // =====================================================
        // MARK ONE NOTIFICATION AS READ
        // PUT /api/Notifications/{id}/read
        // =====================================================

        [HttpPut("{id:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User ID not found in token."
                });
            }

            var result =
                await _notificationService
                    .MarkAsReadAsync(
                        id,
                        userId.Value
                    );

            if (!result)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            return Ok(new
            {
                message = "Notification marked as read."
            });
        }

        // =====================================================
        // MARK ALL AS READ
        // PUT /api/Notifications/read-all
        // =====================================================

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User ID not found in token."
                });
            }

            await _notificationService
                .MarkAllAsReadAsync(userId.Value);

            return Ok(new
            {
                message = "All notifications marked as read."
            });
        }

        // =====================================================
        // INTERNAL CREATE NOTIFICATION
        //
        // Used ONLY by backend microservices
        //
        // POST /api/Notifications/internal
        // Header:
        // X-Internal-Key: KnowFlowAI-Internal-2026-Secret-Key
        // =====================================================

        [AllowAnonymous]
        [HttpPost("internal")]
        public async Task<IActionResult> CreateInternal(
            [FromBody] CreateNotificationDto dto)
        {
            // ---------------------------------------------
            // Validate internal API key
            // ---------------------------------------------

            var configuredKey =
                _configuration["InternalApiKey"];

            if (string.IsNullOrWhiteSpace(configuredKey))
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Internal API key is not configured."
                    }
                );
            }

            if (!Request.Headers.TryGetValue(
                    "X-Internal-Key",
                    out var providedKey))
            {
                return Unauthorized(new
                {
                    message =
                        "Internal API key is required."
                });
            }

            if (!string.Equals(
                    providedKey.ToString(),
                    configuredKey,
                    StringComparison.Ordinal))
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid internal API key."
                });
            }

            // ---------------------------------------------
            // Validate DTO
            // ---------------------------------------------

            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "Notification data is required."
                });
            }

            if (dto.UserId == Guid.Empty)
            {
                return BadRequest(new
                {
                    message =
                        "UserId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new
                {
                    message =
                        "Title is required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Message))
            {
                return BadRequest(new
                {
                    message =
                        "Message is required."
                });
            }

            // ---------------------------------------------
            // Create notification
            // ---------------------------------------------

            try
            {
                var notification =
                    await _notificationService.CreateAsync(
                        dto.UserId,
                        dto.Title,
                        dto.Message,
                        dto.Type
                    );

                Console.WriteLine(
                    "========================================"
                );

                Console.WriteLine(
                    "NOTIFICATION CREATED"
                );

                Console.WriteLine(
                    $"UserId: {notification.UserId}"
                );

                Console.WriteLine(
                    $"Title: {notification.Title}"
                );

                Console.WriteLine(
                    $"Type: {notification.Type}"
                );

                Console.WriteLine(
                    "========================================"
                );

                return Ok(notification);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Notification creation error: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Failed to create notification.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET CURRENT USER ID FROM JWT
        // =====================================================

        private Guid? GetCurrentUserId()
        {
            var value =
                User.FindFirst(
                    ClaimTypes.NameIdentifier
                )?.Value
                ??
                User.FindFirst(
                    JwtRegisteredClaimNames.Sub
                )?.Value
                ??
                User.FindFirst("sub")
                    ?.Value;

            if (Guid.TryParse(value, out var id))
            {
                return id;
            }

            return null;
        }
    }
}
