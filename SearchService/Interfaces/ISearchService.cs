using SearchService.Models;

namespace SearchService.Interfaces
{
    public interface ISearchService
    {
        Task<List<SearchResult>> SearchAsync(
            string query,
            Guid userId,
            string role,
            int limit,
            string authorizationHeader);
    }
}