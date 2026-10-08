using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AuthService.Data;
using AuthService.Models;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuditLogsController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ============================================================
        // GET: api/AuditLogs
        // Admin
        // ============================================================
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(x => x.Timestamp)
                .Take(500)
                .ToListAsync();

            return Ok(logs);
        }

        // ============================================================
        // GET: api/AuditLogs/activity
        // Admin / Manager
        // ============================================================
        [HttpGet("activity")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetActivity()
        {
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(x => x.Timestamp)
                .Take(100)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.UserName,
                    x.Action,
                    x.Category,
                    x.Target,
                    x.Description,
                    x.Status,
                    createdAt = x.Timestamp
                })
                .ToListAsync();

            return Ok(logs);
        }

        // ============================================================
        // GET: api/AuditLogs/me
        // Current authenticated user
        // ============================================================
        [HttpGet("me")]
        public async Task<IActionResult> GetMyLogs()
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new
                {
                    message = "User ID not found in token."
                });
            }

            var logs = await _context.AuditLogs
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .Take(500)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.UserName,
                    x.Action,
                    x.Category,
                    x.Target,
                    x.Description,
                    x.Status,
                    createdAt = x.Timestamp
                })
                .ToListAsync();

            return Ok(logs);
        }

        // ============================================================
        // GET: api/AuditLogs/insights
        // Student Learning Insights
        // ============================================================
        [HttpGet("insights")]
        public async Task<IActionResult> GetLearningInsights()
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "User ID not found in token."
                    });
                }

                var today = DateTime.UtcNow.Date;

                // Today + previous 6 days = 7 days
                var startDate = today.AddDays(-6);

                var logs = await _context.AuditLogs
                    .AsNoTracking()
                    .Where(x =>
                        x.UserId == userId &&
                        x.Timestamp >= startDate)
                    .OrderByDescending(x => x.Timestamp)
                    .ToListAsync();

                // ====================================================
                // TOTAL ACTIVITIES
                // ====================================================
                var totalActivities = logs.Count;

                // ====================================================
                // ACTIVE DAYS
                // ====================================================
                var activeDays = logs
                    .Select(x => x.Timestamp.Date)
                    .Distinct()
                    .Count();

                // ====================================================
                // SEARCHES
                // ====================================================
                var searches = logs.Count(x =>
                    ContainsIgnoreCase(x.Action, "search") ||
                    ContainsIgnoreCase(x.Category, "search") ||
                    ContainsIgnoreCase(x.Category, "knowledge"));

                // ====================================================
                // AI INTERACTIONS
                // ====================================================
                var aiInteractions = logs.Count(x =>
                    ContainsIgnoreCase(x.Action, "ai") ||
                    ContainsIgnoreCase(x.Action, "copilot") ||
                    ContainsIgnoreCase(x.Action, "assistant") ||
                    ContainsIgnoreCase(x.Category, "ai"));

                // ====================================================
                // DOCUMENT ACTIONS
                // ====================================================
                var documentActions = logs.Count(x =>
                    ContainsIgnoreCase(x.Action, "document") ||
                    ContainsIgnoreCase(x.Category, "document") ||
                    ContainsIgnoreCase(x.Target, "document"));

                // ====================================================
                // WEEKLY ACTIVITIES
                // ====================================================
                var weeklyActivities = new List<object>();

                for (int i = 0; i < 7; i++)
                {
                    var date = startDate.AddDays(i);

                    var activities = logs.Count(x =>
                        x.Timestamp.Date == date);

                    weeklyActivities.Add(new
                    {
                        date = date.ToString("yyyy-MM-dd"),
                        day = date.ToString("ddd"),
                        activities
                    });
                }

                // ====================================================
                // ACTIVITY DATES
                // ====================================================
                var activityDates = logs
                    .Select(x => x.Timestamp.Date)
                    .Distinct()
                    .ToHashSet();

                // ====================================================
                // LEARNING STREAK
                // ====================================================
                var learningStreak = 0;

                var streakDate = today;

                if (!activityDates.Contains(streakDate))
                {
                    streakDate = today.AddDays(-1);
                }

                while (activityDates.Contains(streakDate))
                {
                    learningStreak++;

                    streakDate = streakDate.AddDays(-1);
                }

                // ====================================================
                // LEARNING SCORE
                // ====================================================
                var activityScore = Math.Min(
                    totalActivities * 5,
                    40
                );

                var activeDayScore = Math.Min(
                    activeDays * 5,
                    35
                );

                var aiScore = Math.Min(
                    aiInteractions * 2,
                    15
                );

                var streakScore = Math.Min(
                    learningStreak * 2,
                    10
                );

                var learningScore = Math.Min(
                    activityScore +
                    activeDayScore +
                    aiScore +
                    streakScore,
                    100
                );

                // ====================================================
                // TOPICS
                // ====================================================
                var topics = logs
                    .Where(x => !string.IsNullOrWhiteSpace(x.Category))
                    .GroupBy(x => x.Category!)
                    .Select(g => new
                    {
                        name = g.Key,
                        activities = g.Count()
                    })
                    .OrderByDescending(x => x.activities)
                    .Take(8)
                    .ToList();

                // ====================================================
                // KNOWLEDGE STATE
                // ====================================================
                string knowledgeState;

                if (learningScore < 30)
                {
                    knowledgeState = "Getting started";
                }
                else if (learningScore < 60)
                {
                    knowledgeState = "Building momentum";
                }
                else if (learningScore < 80)
                {
                    knowledgeState = "Strong progress";
                }
                else
                {
                    knowledgeState = "Excellent progress";
                }

                // ====================================================
                // KNOWLEDGE PULSE
                // ====================================================
                string knowledgePulse;

                if (totalActivities == 0)
                {
                    knowledgePulse =
                        "Your learning journey is ready to begin.";
                }
                else if (learningStreak >= 5)
                {
                    knowledgePulse =
                        "Excellent consistency! Keep your learning streak going.";
                }
                else if (activeDays >= 3)
                {
                    knowledgePulse =
                        "Good learning activity this week. Keep building momentum.";
                }
                else
                {
                    knowledgePulse =
                        "You have started learning. Try to stay active regularly.";
                }

                // ====================================================
                // LAST ACTIVITY
                // ====================================================
                var lastActivity = logs
                    .OrderByDescending(x => x.Timestamp)
                    .Select(x => new
                    {
                        action = x.Action,
                        category = x.Category,
                        description = x.Description,
                        createdAt = x.Timestamp
                    })
                    .FirstOrDefault();

                // ====================================================
                // RESPONSE
                // ====================================================
                return Ok(new
                {
                    learningScore,

                    activeDays,

                    activeDaysTotal = 7,

                    aiInteractions,

                    learningStreak,

                    totalActivities,

                    documents = documentActions,

                    documentActions,

                    searches,

                    weeklyActivities,

                    topics,

                    knowledgePulse,

                    knowledgeState,

                    lastActivity
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Learning Insights Error:");
                Console.WriteLine(ex);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Failed to calculate learning insights.",
                        error = ex.Message
                    }
                );
            }
        }

        // ============================================================
        // GET: api/AuditLogs/{id}
        // Admin
        // ============================================================
        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var log = await _context.AuditLogs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (log == null)
            {
                return NotFound(new
                {
                    message = "Audit log not found."
                });
            }

            return Ok(log);
        }

        // ============================================================
        // POST: api/AuditLogs
        // Admin
        // ============================================================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            [FromBody] CreateAuditLogRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Invalid request."
                });
            }

            var log = new AuditLog
            {
                UserId = request.UserId,
                UserName = request.UserName ?? "System",
                Action = request.Action ?? "Unknown",
                Category = request.Category ?? "General",
                Target = request.Target,
                Description = request.Description,
                Status = request.Status ?? "Success",

                Timestamp = request.Timestamp ?? DateTime.UtcNow,

                IpAddress =
                    request.IpAddress ??
                    HttpContext.Connection.RemoteIpAddress?.ToString(),

                UserAgent =
                    request.UserAgent ??
                    Request.Headers.UserAgent.ToString()
            };

            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Audit log created successfully.",
                id = log.Id
            });
        }

        // ============================================================
        // POST: api/AuditLogs/internal
        // Internal Service-to-Service Audit Logging
        // SearchService / AIService / DocumentService
        // ============================================================
        [HttpPost("internal")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateInternal(
            [FromHeader(Name = "X-Internal-Key")] string? internalKey,
            [FromBody] CreateAuditLogRequest request)
        {
            try
            {
                // ----------------------------------------------------
                // Get configured internal API key
                // ----------------------------------------------------
                var configuredKey =
                    _configuration["InternalApiKey"];

                if (string.IsNullOrWhiteSpace(configuredKey))
                {
                    Console.WriteLine(
                        "❌ InternalApiKey is missing in AuthService."
                    );

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        new
                        {
                            message =
                                "InternalApiKey is not configured."
                        }
                    );
                }

                // ----------------------------------------------------
                // Validate internal API key
                // ----------------------------------------------------
                if (string.IsNullOrWhiteSpace(internalKey) ||
                    internalKey != configuredKey)
                {
                    Console.WriteLine(
                        "❌ Invalid X-Internal-Key."
                    );

                    return Unauthorized(new
                    {
                        message = "Invalid internal API key."
                    });
                }

                // ----------------------------------------------------
                // Validate request
                // ----------------------------------------------------
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message = "Invalid request."
                    });
                }

                // ----------------------------------------------------
                // Create audit log
                // ----------------------------------------------------
                var log = new AuditLog
                {
                    UserId = request.UserId,
                    UserName = request.UserName ?? "System",
                    Action = request.Action ?? "Unknown",
                    Category = request.Category ?? "General",
                    Target = request.Target,
                    Description = request.Description,
                    Status = request.Status ?? "Success",

                    Timestamp =
                        request.Timestamp ??
                        DateTime.UtcNow,

                    IpAddress =
                        request.IpAddress,

                    UserAgent =
                        request.UserAgent
                };

                _context.AuditLogs.Add(log);

                await _context.SaveChangesAsync();

                Console.WriteLine(
                    $"✅ Internal AuditLog SUCCESS: {log.Action}"
                );

                return Ok(new
                {
                    message =
                        "Internal audit log created successfully.",
                    id = log.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "❌ Internal AuditLog ERROR:"
                );

                Console.WriteLine(ex);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Failed to create internal audit log.",
                        error = ex.Message
                    }
                );
            }
        }

        // ============================================================
        // HELPER: CURRENT USER ID
        // ============================================================
        private string? GetCurrentUserId()
        {
            return User.FindFirst(
                       ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? User.FindFirst("userId")?.Value;
        }

        // ============================================================
        // HELPER: CASE INSENSITIVE SEARCH
        // ============================================================
        private static bool ContainsIgnoreCase(
            string? value,
            string search)
        {
            return !string.IsNullOrWhiteSpace(value)
                   && value.Contains(
                       search,
                       StringComparison.OrdinalIgnoreCase);
        }
    }

    // ============================================================
    // CREATE AUDIT LOG REQUEST
    // ============================================================
    public class CreateAuditLogRequest
    {
        public string? UserId { get; set; }

        public string? UserName { get; set; }

        public string? Action { get; set; }

        public string? Category { get; set; }

        public string? Target { get; set; }

        public string? Description { get; set; }

        public string? Status { get; set; }

        public DateTime? Timestamp { get; set; }

        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }
    }
}