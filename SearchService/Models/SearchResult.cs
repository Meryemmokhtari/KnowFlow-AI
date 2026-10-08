namespace SearchService.Models;

public class SearchResult
{
    public Guid DocumentId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public double Score { get; set; }
}