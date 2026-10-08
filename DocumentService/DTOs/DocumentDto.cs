namespace DocumentService.DTOs
{
    public class DocumentDto
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string FileType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; }

        public string ExtractedText { get; set; } = string.Empty;

        public string? Summary { get; set; }
    }
}