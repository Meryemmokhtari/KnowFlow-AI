using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SearchService.Interfaces;
using SearchService.Models;
using System.Security.Claims;

namespace SearchService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(
        ISearchService searchService)
    {
        _searchService = searchService;
    }

    private Guid? GetCurrentUserId()
    {
        var rawUserId =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("userId");

        if (Guid.TryParse(rawUserId, out var userId) &&
            userId != Guid.Empty)
        {
            return userId;
        }

        return null;
    }

    private string GetCurrentRole()
    {
        var role =
            User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? string.Empty;

        return role.Trim();
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string query,
        [FromQuery] int limit = 5)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid or missing user identity."
            });
        }

        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new
            {
                message = "Search query is required."
            });
        }

        if (limit < 1)
        {
            limit = 1;
        }

        if (limit > 20)
        {
            limit = 20;
        }

        var role = GetCurrentRole();

        if (string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized(new
            {
                message = "User role is missing."
            });
        }

        var authorizationHeader =
            Request.Headers.Authorization.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return Unauthorized(new
            {
                message = "Authorization token is missing."
            });
        }

        Console.WriteLine("======================================");
        Console.WriteLine("SEARCH CONTROLLER");
        Console.WriteLine($"UserId : {userId.Value}");
        Console.WriteLine($"Role   : {role}");
        Console.WriteLine($"Query  : {query.Trim()}");
        Console.WriteLine("======================================");

        try
        {
            var results =
                await _searchService.SearchAsync(
                    query.Trim(),
                    userId.Value,
                    role,
                    limit,
                    authorizationHeader
                );

            return Ok(new
            {
                query = query.Trim(),
                count = results.Count,
                results
            });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    message = "A required service is unavailable.",
                    error = ex.Message
                });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Search failed.",
                    error = ex.Message
                });
        }
    }

    [AllowAnonymous]
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            service = "SearchService",
            status = "OK",
            timestamp = DateTime.UtcNow
        });
    }
}