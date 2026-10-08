vnamespace KnowFlow.Shared.DTOs;

public class AIResponseDto
{
    public string Answer { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}