using DocumentFormat.OpenXml.Packaging;
using DocumentService.Interfaces;
using UglyToad.PdfPig;
using System.Text;

namespace DocumentService.Services
{
    public class TextExtractionService : ITextExtractionService
    {
        // =====================================================
        // MAIN METHOD
        // =====================================================

        public async Task<string> ExtractTextAsync(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                Console.WriteLine(
                    "TextExtractionService: filePath is empty.");

                return string.Empty;
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine(
                    $"TextExtractionService: file not found: {filePath}");

                return string.Empty;
            }

            try
            {
                var extension = Path
                    .GetExtension(filePath)
                    .ToLowerInvariant();

                Console.WriteLine(
                    $"TextExtractionService: extracting {extension}");

                var text = await Task.Run(() =>
                {
                    return extension switch
                    {
                        ".pdf" =>
                            ExtractPdf(filePath),

                        ".docx" =>
                            ExtractWord(filePath),

                        ".txt" =>
                            File.ReadAllText(
                                filePath,
                                Encoding.UTF8),

                        _ => string.Empty
                    };
                });

                if (string.IsNullOrWhiteSpace(text))
                {
                    Console.WriteLine(
                        "TextExtractionService: no text extracted.");
                }
                else
                {
                    Console.WriteLine(
                        $"TextExtractionService: extracted {text.Length} characters.");
                }

                return text.Trim();
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"TextExtractionService ERROR: {ex.Message}");

                Console.WriteLine(
                    $"StackTrace: {ex.StackTrace}");

                return string.Empty;
            }
        }

        // =====================================================
        // PDF
        // =====================================================

        private string ExtractPdf(string filePath)
        {
            var result = new StringBuilder();

            using var document = PdfDocument.Open(filePath);

            Console.WriteLine(
                $"PDF opened successfully. Pages: {document.NumberOfPages}");

            foreach (var page in document.GetPages())
            {
                try
                {
                    var pageText = page.Text;

                    if (!string.IsNullOrWhiteSpace(pageText))
                    {
                        result.AppendLine(pageText);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"Error extracting PDF page: {ex.Message}");
                }
            }

            return result.ToString();
        }

        // =====================================================
        // WORD
        // =====================================================

        private string ExtractWord(string filePath)
        {
            using var document =
                WordprocessingDocument.Open(
                    filePath,
                    false);

            var mainPart =
                document.MainDocumentPart;

            if (mainPart == null)
            {
                Console.WriteLine(
                    "DOCX: MainDocumentPart is null.");

                return string.Empty;
            }

            var wordDocument =
                mainPart.Document;

            if (wordDocument == null)
            {
                Console.WriteLine(
                    "DOCX: Document is null.");

                return string.Empty;
            }

            var body =
                wordDocument.Body;

            if (body == null)
            {
                Console.WriteLine(
                    "DOCX: Body is null.");

                return string.Empty;
            }

            return body.InnerText ?? string.Empty;
        }
    }
}