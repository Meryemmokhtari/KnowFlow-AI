namespace DocumentService.Interfaces
{
    public interface ITextExtractionService
    {
        Task<string> ExtractTextAsync(string filePath);
    }
}