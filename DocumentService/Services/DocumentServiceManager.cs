using DocumentService.DTOs;
using DocumentService.Interfaces;
using DocumentService.Models;
using System.Net.Http.Json;

namespace DocumentService.Services
{
    public class DocumentServiceManager : IDocumentService
    {
        private readonly IDocumentRepository _documentRepository;

        private readonly HttpClient _aiClient;
        private readonly HttpClient _authClient;

        private readonly IEmbeddingService _embeddingService;
        private readonly IQdrantService _qdrantService;

        private readonly IConfiguration _configuration;

        public DocumentServiceManager(
            IDocumentRepository documentRepository,
            IHttpClientFactory httpClientFactory,
            IEmbeddingService embeddingService,
            IQdrantService qdrantService,
            IConfiguration configuration)
        {
            _documentRepository = documentRepository;

            _aiClient =
                httpClientFactory.CreateClient("AIClient");

            _authClient =
                httpClientFactory.CreateClient("AuthClient");

            _embeddingService = embeddingService;
            _qdrantService = qdrantService;

            _configuration = configuration;
        }

        // =====================================================
        // GET DOCUMENTS OF CURRENT USER
        // =====================================================

        public async Task<IEnumerable<DocumentDto>> GetAllAsync(
            Guid userId)
        {
            if (userId == Guid.Empty)
            {
                return Enumerable.Empty<DocumentDto>();
            }

            var documents =
                await _documentRepository
                    .GetByUserIdAsync(userId);

            return documents.Select(MapToDto);
        }

        // =====================================================
        // GET DOCUMENT BY ID
        // =====================================================

        public async Task<DocumentDto?> GetByIdAsync(
            Guid id)
        {
            var document =
                await _documentRepository
                    .GetByIdAsync(id);

            if (document == null)
            {
                return null;
            }

            return MapToDto(document);
        }

        // =====================================================
        // CREATE DOCUMENT
        // =====================================================

        public async Task<DocumentDto> CreateAsync(
            CreateDocumentDto dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(
                    nameof(dto)
                );
            }

            if (dto.UserId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Document UserId cannot be empty.",
                    nameof(dto.UserId)
                );
            }

            // =================================================
            // CREATE DOCUMENT ENTITY
            // =================================================

            var document = new Document
            {
                Id = Guid.NewGuid(),

                UserId = dto.UserId,

                FileName = dto.FileName,

                FilePath = dto.FilePath,

                FileType = dto.FileType,

                FileSize = dto.FileSize,

                ExtractedText = dto.ExtractedText,

                UploadedAt = DateTime.UtcNow,

                Summary = null
            };

            // =================================================
            // AI SUMMARY
            // =================================================

            var textForSummary =
                LimitTextForAI(
                    document.ExtractedText,
                    12000
                );

            if (!string.IsNullOrWhiteSpace(
                textForSummary))
            {
                try
                {
                    Console.WriteLine(
                        $"Sending {textForSummary.Length} characters to AI summary..."
                    );

                    var request = new
                    {
                        text = textForSummary
                    };

                    var response =
                        await _aiClient.PostAsJsonAsync(
                            "api/AI/summary",
                            request
                        );

                    response.EnsureSuccessStatusCode();

                    var summary =
                        await response.Content
                            .ReadAsStringAsync();

                    document.Summary = summary;

                    Console.WriteLine(
                        "AI summary generated successfully."
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"AI Summary error: {ex.Message}"
                    );

                    document.Summary =
                        "AI Summary unavailable.";
                }
            }
            else
            {
                document.Summary =
                    "No text available for summary.";
            }

            // =================================================
            // SAVE DOCUMENT TO DATABASE
            // =================================================

            await _documentRepository
                .AddAsync(document);

            await _documentRepository
                .SaveChangesAsync();

            Console.WriteLine(
                $"Document saved in MySQL: {document.Id}"
            );

            // =================================================
            // AUDIT LOG
            // =================================================

            try
            {
                await CreateDocumentAuditLogAsync(
                    document.UserId,
                    document.FileName,
                    document.Id,
                    "Success"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Document audit log error: {ex.Message}"
                );
            }

            // =================================================
            // NOTIFICATION
            // =================================================

            try
            {
                await CreateDocumentNotificationAsync(
                    document.UserId,
                    document.FileName
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Notification error: {ex.Message}"
                );
            }

            // =================================================
            // QDRANT COLLECTION
            // =================================================

            try
            {
                await _qdrantService
                    .CreateCollectionAsync();

                Console.WriteLine(
                    "Qdrant collection ready."
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Qdrant collection error: {ex.Message}"
                );
            }

            // =================================================
            // GENERATE EMBEDDING
            // =================================================

            if (!string.IsNullOrWhiteSpace(
                document.ExtractedText))
            {
                try
                {
                    Console.WriteLine(
                        "Generating document embedding..."
                    );

                    var textForEmbedding =
                        LimitTextForAI(
                            document.ExtractedText,
                            12000
                        );

                    var embedding =
                        await _embeddingService
                            .GenerateEmbeddingAsync(
                                textForEmbedding
                            );

                    Console.WriteLine(
                        $"Embedding generated: {embedding.Length} dimensions."
                    );

                    // =================================================
                    // IMPORTANT:
                    // STORE USER ID IN QDRANT
                    // =================================================

                    await _qdrantService
                        .StoreEmbeddingAsync(
                            document.Id,
                            embedding,
                            document.FileName,
                            document.UserId
                        );

                    Console.WriteLine(
                        $"Embedding stored successfully in Qdrant for user: {document.UserId}"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"Embedding/Qdrant error: {ex.Message}"
                    );
                }
            }
            else
            {
                Console.WriteLine(
                    "No extracted text available for embedding."
                );
            }

            return MapToDto(document);
        }

        // =====================================================
        // ASK QUESTION ABOUT DOCUMENT
        // =====================================================

        public async Task<string?> AskQuestionAsync(
            Guid documentId,
            string question)
        {
            var document =
                await _documentRepository
                    .GetByIdAsync(documentId);

            if (document == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(
                document.ExtractedText))
            {
                return "No document text available.";
            }

            if (string.IsNullOrWhiteSpace(question))
            {
                return "Question cannot be empty.";
            }

            var textForQuestion =
                LimitTextForAI(
                    document.ExtractedText,
                    12000
                );

            try
            {
                Console.WriteLine(
                    $"Sending {textForQuestion.Length} characters to AI question service..."
                );

                var request = new
                {
                    text = textForQuestion,
                    question = question
                };

                var response =
                    await _aiClient.PostAsJsonAsync(
                        "api/AI/ask",
                        request
                    );

                response.EnsureSuccessStatusCode();

                var answer =
                    await response.Content
                        .ReadAsStringAsync();

                try
                {
                    await CreateAIQuestionAuditLogAsync(
                        document.UserId,
                        document.FileName,
                        document.Id,
                        question,
                        "Success"
                    );
                }
                catch (Exception auditEx)
                {
                    Console.WriteLine(
                        $"AI question audit error: {auditEx.Message}"
                    );
                }

                return answer;
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"AI Question error: {ex.Message}"
                );

                try
                {
                    await CreateAIQuestionAuditLogAsync(
                        document.UserId,
                        document.FileName,
                        document.Id,
                        question,
                        "Failed"
                    );
                }
                catch (Exception auditEx)
                {
                    Console.WriteLine(
                        $"Failed AI audit error: {auditEx.Message}"
                    );
                }

                return "AI Answer unavailable.";
            }
        }

        // =====================================================
        // DELETE DOCUMENT
        // =====================================================

        public async Task DeleteAsync(
            Guid id)
        {
            var document =
                await _documentRepository
                    .GetByIdAsync(id);

            if (document == null)
            {
                return;
            }

            _documentRepository.Delete(document);

            await _documentRepository
                .SaveChangesAsync();

            Console.WriteLine(
                $"Document deleted: {id}"
            );
        }

        // =====================================================
        // AUDIT LOG — DOCUMENT UPLOAD
        // =====================================================

        private async Task CreateDocumentAuditLogAsync(
            Guid userId,
            string fileName,
            Guid documentId,
            string status)
        {
            if (userId == Guid.Empty)
            {
                Console.WriteLine(
                    "Audit log skipped: UserId is empty."
                );

                return;
            }

            var internalApiKey =
                _configuration["InternalApiKey"];

            if (string.IsNullOrWhiteSpace(
                internalApiKey))
            {
                Console.WriteLine(
                    "Audit log skipped: InternalApiKey is not configured."
                );

                return;
            }

            var auditLog = new
            {
                UserId = userId.ToString(),
                UserName = "User",
                Action = "Document Upload",
                Category = "Document",
                Target = "DocumentService",

                Description =
                    $"Document \"{fileName}\" uploaded successfully. Document ID: {documentId}",

                Status = status,
                IpAddress = (string?)null,
                UserAgent = (string?)null
            };

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    "api/AuditLogs/internal"
                );

            request.Headers.Add(
                "X-Internal-Key",
                internalApiKey
            );

            request.Content =
                JsonContent.Create(auditLog);

            var response =
                await _authClient
                    .SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error =
                    await response.Content
                        .ReadAsStringAsync();

                Console.WriteLine(
                    $"Audit API failed: {(int)response.StatusCode} - {error}"
                );

                return;
            }

            Console.WriteLine(
                $"Document audit log created successfully for user: {userId}"
            );
        }

        // =====================================================
        // AUDIT LOG — AI QUESTION
        // =====================================================

        private async Task CreateAIQuestionAuditLogAsync(
            Guid userId,
            string fileName,
            Guid documentId,
            string question,
            string status)
        {
            if (userId == Guid.Empty)
            {
                Console.WriteLine(
                    "AI audit skipped: UserId is empty."
                );

                return;
            }

            var internalApiKey =
                _configuration["InternalApiKey"];

            if (string.IsNullOrWhiteSpace(
                internalApiKey))
            {
                Console.WriteLine(
                    "AI audit skipped: InternalApiKey is not configured."
                );

                return;
            }

            var cleanQuestion =
                question.Length > 250
                    ? question.Substring(0, 250) + "..."
                    : question;

            var auditLog = new
            {
                UserId = userId.ToString(),
                UserName = "User",
                Action = "AI Question",
                Category = "AI",
                Target = "AIService",

                Description =
                    $"AI question about document \"{fileName}\": \"{cleanQuestion}\"",

                Status = status,
                IpAddress = (string?)null,
                UserAgent = (string?)null
            };

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    "api/AuditLogs/internal"
                );

            request.Headers.Add(
                "X-Internal-Key",
                internalApiKey
            );

            request.Content =
                JsonContent.Create(auditLog);

            var response =
                await _authClient
                    .SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error =
                    await response.Content
                        .ReadAsStringAsync();

                Console.WriteLine(
                    $"AI audit API failed: {(int)response.StatusCode} - {error}"
                );

                return;
            }

            Console.WriteLine(
                $"AI question audit log created for user: {userId}"
            );
        }

        // =====================================================
        // CREATE DOCUMENT NOTIFICATION
        // =====================================================

        private async Task CreateDocumentNotificationAsync(
            Guid userId,
            string fileName)
        {
            if (userId == Guid.Empty)
            {
                Console.WriteLine(
                    "Notification skipped: UserId is empty."
                );

                return;
            }

            var internalApiKey =
                _configuration["InternalApiKey"];

            if (string.IsNullOrWhiteSpace(
                internalApiKey))
            {
                Console.WriteLine(
                    "Notification skipped: InternalApiKey is not configured."
                );

                return;
            }

            var notification = new
            {
                UserId = userId,

                Title = "New document uploaded",

                Message =
                    $"The document \"{fileName}\" has been successfully uploaded.",

                Type = "document"
            };

            using var request =
                new HttpRequestMessage(
                    HttpMethod.Post,
                    "api/Notifications/internal"
                );

            request.Headers.Add(
                "X-Internal-Key",
                internalApiKey
            );

            request.Content =
                JsonContent.Create(notification);

            var response =
                await _authClient
                    .SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error =
                    await response.Content
                        .ReadAsStringAsync();

                Console.WriteLine(
                    $"Notification API failed: {(int)response.StatusCode} - {error}"
                );

                return;
            }

            Console.WriteLine(
                $"Notification created successfully for user: {userId}"
            );
        }

        // =====================================================
        // LIMIT TEXT FOR AI
        // =====================================================

        private static string LimitTextForAI(
            string? text,
            int maxCharacters = 12000)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            if (text.Length <= maxCharacters)
            {
                return text;
            }

            return text.Substring(
                0,
                maxCharacters
            )
            + "\n\n[Document truncated for AI processing]";
        }

        // =====================================================
        // MAP ENTITY → DTO
        // =====================================================

        private static DocumentDto MapToDto(
            Document document)
        {
            return new DocumentDto
            {
                Id = document.Id,
                UserId = document.UserId,
                FileName = document.FileName,
                FilePath = document.FilePath,
                FileType = document.FileType,
                FileSize = document.FileSize,
                UploadedAt = document.UploadedAt,
                ExtractedText = document.ExtractedText,
                Summary = document.Summary
            };
        }
    }
}