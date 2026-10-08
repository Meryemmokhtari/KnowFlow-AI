namespace KnowFlow.Shared.Responses;

public class ErrorResponse
{
    public bool Success => false;

    public string Message { get; set; } = string.Empty;
}