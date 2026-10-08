namespace SearchService.DTOs;

public class SearchResponse
{
    public Guid DocumentId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public double Score { get; set; }
}