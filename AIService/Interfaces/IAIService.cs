namespace AIService.Interfaces
{
    public interface IAIService
    {
        Task<string> GenerateSummaryAsync(string text);

        Task<string> AskQuestionAsync(
            string text,
            string question
        );
    }
}