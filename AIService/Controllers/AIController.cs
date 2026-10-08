using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace AIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        // =====================================================
        // LOW MEMORY SETTINGS
        // =====================================================

        private const int MaxContextLength = 6000;

        // =====================================================
        // CONSTRUCTOR
        // =====================================================

        public AIController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // =====================================================
        // HEALTH
        // GET: /api/AI/health
        // =====================================================

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new
            {
                status = "online",
                service = "AIService",
                model =
                    _configuration["Ollama:Model"]
                    ?? "llama3.2:1b",
                timestamp = DateTime.UtcNow
            });
        }

        // =====================================================
        // ASK AI
        // POST: /api/AI/ask
        // =====================================================

        [HttpPost("ask")]
        [Authorize]
        public async Task<IActionResult> Ask(
            [FromBody] AskQuestionDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Request is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new
                {
                    message = "Document text is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Question))
            {
                return BadRequest(new
                {
                    message = "Question is required."
                });
            }

            try
            {
                Console.WriteLine(
                    "=============================================="
                );

                Console.WriteLine(
                    "AI Question received."
                );

                Console.WriteLine(
                    $"Document length: {request.Text.Length}"
                );

                Console.WriteLine(
                    $"Question: {request.Question}"
                );

                var instruction = $"""
                Answer the QUESTION using ONLY the DOCUMENT.

                QUESTION:
                {request.Question.Trim()}

                RULES:
                1. Use only information found in the DOCUMENT.
                2. Do not use outside knowledge.
                3. Do not say the document is missing.
                4. If the answer is not found, return exactly:
                The answer is not available in the document.
                5. Give a short and direct answer.
                """;

                var answer =
                    await GenerateWithOllamaAsync(
                        request.Text,
                        instruction,
                        maxTokens: 250
                    );

                await CreateAuditLogAsync(
                    "AI Question",
                    "Artificial Intelligence",
                    "AIService",
                    $"AI question asked: \"{request.Question.Trim()}\"",
                    "Success"
                );

                Console.WriteLine(
                    "AI response generated successfully."
                );

                Console.WriteLine(
                    "=============================================="
                );

                return Ok(new
                {
                    answer
                });
            }
            catch (TaskCanceledException)
            {
                await CreateAuditLogAsync(
                    "AI Question",
                    "Artificial Intelligence",
                    "AIService",
                    "AI question request timed out.",
                    "Failed"
                );

                return StatusCode(
                    StatusCodes.Status504GatewayTimeout,
                    new
                    {
                        message =
                            "Ollama request timed out. " +
                            "The model is taking too long to respond."
                    }
                );
            }
            catch (HttpRequestException ex)
            {
                await CreateAuditLogAsync(
                    "AI Question",
                    "Artificial Intelligence",
                    "AIService",
                    "AI question failed because Ollama was unavailable.",
                    "Failed"
                );

                Console.WriteLine(
                    $"OLLAMA ERROR: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message = "Unable to connect to Ollama.",
                        error = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                await CreateAuditLogAsync(
                    "AI Question",
                    "Artificial Intelligence",
                    "AIService",
                    "AI question generation failed.",
                    "Failed"
                );

                Console.WriteLine(
                    $"AI ERROR: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "AIService error.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // SUMMARY
        // POST: /api/AI/summary
        // =====================================================

        [HttpPost("summary")]
        [Authorize]
        public async Task<IActionResult> Summary(
            [FromBody] SummaryRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Request is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new
                {
                    message = "Document text is required."
                });
            }

            try
            {
                Console.WriteLine(
                    "=============================================="
                );

                Console.WriteLine(
                    "AI Summary received."
                );

                Console.WriteLine(
                    $"Document length: {request.Text.Length}"
                );

                var instruction = """
                Summarize the DOCUMENT.

                RULES:
                - Use ONLY the DOCUMENT.
                - Do NOT use outside knowledge.
                - Do NOT say that the document is missing.
                - Do NOT ask for a document.
                - Keep the main ideas and important concepts.
                - Write one short academic paragraph.
                - Return ONLY the summary.
                """;

                var summary =
                    await GenerateWithOllamaAsync(
                        request.Text,
                        instruction,
                        maxTokens: 180
                    );

                if (string.IsNullOrWhiteSpace(summary))
                {
                    summary =
                        "Unable to generate a summary.";
                }

                await CreateAuditLogAsync(
                    "AI Summary",
                    "Artificial Intelligence",
                    "AIService",
                    "AI document summary generated successfully.",
                    "Success"
                );

                Console.WriteLine(
                    $"Summary generated: {summary}"
                );

                Console.WriteLine(
                    "=============================================="
                );

                return Ok(new
                {
                    summary
                });
            }
            catch (TaskCanceledException)
            {
                await CreateAuditLogAsync(
                    "AI Summary",
                    "Artificial Intelligence",
                    "AIService",
                    "AI summary request timed out.",
                    "Failed"
                );

                return StatusCode(
                    StatusCodes.Status504GatewayTimeout,
                    new
                    {
                        message =
                            "Ollama request timed out."
                    }
                );
            }
            catch (HttpRequestException ex)
            {
                await CreateAuditLogAsync(
                    "AI Summary",
                    "Artificial Intelligence",
                    "AIService",
                    "AI summary failed because Ollama was unavailable.",
                    "Failed"
                );

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Unable to connect to Ollama.",
                        error = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                await CreateAuditLogAsync(
                    "AI Summary",
                    "Artificial Intelligence",
                    "AIService",
                    "AI summary generation failed.",
                    "Failed"
                );

                Console.WriteLine(
                    $"SUMMARY ERROR: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "AIService error.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // QUIZ
        // POST: /api/AI/quiz
        // =====================================================

        [HttpPost("quiz")]
        [Authorize]
        public async Task<IActionResult> GenerateQuiz(
            [FromBody] QuizRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Request is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new
                {
                    message = "Document text is required."
                });
            }

            // Keep quiz small for llama3.2:1b
            var count = request.Count;

            if (count < 5)
            {
                count = 5;
            }

            if (count > 5)
            {
                count = 5;
            }

            var difficulty =
                string.IsNullOrWhiteSpace(request.Difficulty)
                    ? "medium"
                    : request.Difficulty
                        .Trim()
                        .ToLowerInvariant();

            try
            {
                Console.WriteLine(
                    "=============================================="
                );

                Console.WriteLine(
                    "AI Quiz received."
                );

                Console.WriteLine(
                    $"Questions: {count}"
                );

                Console.WriteLine(
                    $"Difficulty: {difficulty}"
                );

                Console.WriteLine(
                    $"Document length: {request.Text.Length}"
                );

                var instruction =
                    BuildQuizPrompt(
                        count,
                        difficulty
                    );

                var rawResponse =
                    await GenerateWithOllamaAsync(
                        request.Text,
                        instruction,
                        maxTokens: 1200,
                        jsonMode: true
                    );

                Console.WriteLine(
                    $"Raw quiz response length: {rawResponse.Length}"
                );

                Console.WriteLine(
                    $"Raw quiz response: {rawResponse}"
                );

                var cleanJson =
                    CleanJsonResponse(
                        rawResponse
                    );

                using var jsonDocument =
                    JsonDocument.Parse(cleanJson);

                if (!jsonDocument.RootElement.TryGetProperty(
                        "questions",
                        out var questions))
                {
                    throw new JsonException(
                        "AI response does not contain a 'questions' array."
                    );
                }

                if (questions.ValueKind != JsonValueKind.Array)
                {
                    throw new JsonException(
                        "'questions' must be a JSON array."
                    );
                }

                if (questions.GetArrayLength() == 0)
                {
                    throw new JsonException(
                        "AI returned an empty questions array."
                    );
                }

                await CreateAuditLogAsync(
                    "AI Quiz",
                    "Artificial Intelligence",
                    "AIService",
                    $"AI quiz generated with {count} questions at {difficulty} difficulty.",
                    "Success"
                );

                Console.WriteLine(
                    "Quiz generated successfully."
                );

                Console.WriteLine(
                    "=============================================="
                );

                return Content(
                    jsonDocument.RootElement.GetRawText(),
                    "application/json"
                );
            }
            catch (JsonException ex)
            {
                await CreateAuditLogAsync(
                    "AI Quiz",
                    "Artificial Intelligence",
                    "AIService",
                    "AI quiz returned invalid JSON.",
                    "Failed"
                );

                Console.WriteLine(
                    $"QUIZ JSON ERROR: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "AI returned an invalid quiz format.",
                        error = ex.Message
                    }
                );
            }
            catch (TaskCanceledException)
            {
                await CreateAuditLogAsync(
                    "AI Quiz",
                    "Artificial Intelligence",
                    "AIService",
                    "AI quiz request timed out.",
                    "Failed"
                );

                return StatusCode(
                    StatusCodes.Status504GatewayTimeout,
                    new
                    {
                        message =
                            "Ollama request timed out."
                    }
                );
            }
            catch (HttpRequestException ex)
            {
                await CreateAuditLogAsync(
                    "AI Quiz",
                    "Artificial Intelligence",
                    "AIService",
                    "AI quiz failed because Ollama was unavailable.",
                    "Failed"
                );

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Unable to connect to Ollama.",
                        error = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                await CreateAuditLogAsync(
                    "AI Quiz",
                    "Artificial Intelligence",
                    "AIService",
                    "AI quiz generation failed.",
                    "Failed"
                );

                Console.WriteLine(
                    $"QUIZ ERROR: {ex.Message}"
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "AIService error.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // OLLAMA GENERATION
        // =====================================================

        private async Task<string> GenerateWithOllamaAsync(
            string documentText,
            string instruction,
            int maxTokens = 256,
            bool jsonMode = false)
        {
            var baseUrl =
                _configuration["Ollama:BaseUrl"]
                ?? "http://localhost:11434";

            var model =
                _configuration["Ollama:Model"]
                ?? "llama3.2:1b";

            baseUrl =
                baseUrl.TrimEnd('/');

            // =================================================
            // LIMIT DOCUMENT
            // =================================================

            var originalLength =
                documentText.Length;

            if (documentText.Length > MaxContextLength)
            {
                documentText =
                    documentText.Substring(
                        0,
                        MaxContextLength
                    );

                Console.WriteLine(
                    $"Context reduced: {originalLength} -> {documentText.Length}"
                );
            }

            // =================================================
            // PROMPT
            // =================================================

            var prompt = $"""
            You are KnowFlow AI.

            Read the DOCUMENT carefully.

            DOCUMENT:
            {documentText}

            END OF DOCUMENT.

            TASK:
            {instruction}

            IMPORTANT:
            Use the DOCUMENT as the only source of information.
            """;

            // =================================================
            // OLLAMA PAYLOAD
            // =================================================

            var payload =
                new Dictionary<string, object>
                {
                    ["model"] = model,
                    ["prompt"] = prompt,
                    ["stream"] = false,

                    ["options"] = new
                    {
                        num_ctx = 4096,
                        num_predict = maxTokens,
                        temperature = 0.1
                    }
                };

            if (jsonMode)
            {
                payload["format"] = "json";
            }

            var json =
                JsonSerializer.Serialize(
                    payload
                );

            using var content =
                new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

            // =================================================
            // TIMEOUT
            // =================================================

            using var cts =
                new CancellationTokenSource(
                    TimeSpan.FromMinutes(5)
                );

            var client =
                _httpClientFactory.CreateClient();

            client.Timeout =
                TimeSpan.FromMinutes(5);

            Console.WriteLine(
                "----------------------------------------------"
            );

            Console.WriteLine(
                $"Ollama model: {model}"
            );

            Console.WriteLine(
                $"Ollama URL: {baseUrl}/api/generate"
            );

            Console.WriteLine(
                $"Document chars: {documentText.Length}"
            );

            Console.WriteLine(
                "Ollama context: 4096"
            );

            Console.WriteLine(
                $"Ollama num_predict: {maxTokens}"
            );

            Console.WriteLine(
                $"JSON mode: {jsonMode}"
            );

            Console.WriteLine(
                "Sending request to Ollama..."
            );

            // =================================================
            // CALL OLLAMA
            // =================================================

            using var response =
                await client.PostAsync(
                    $"{baseUrl}/api/generate",
                    content,
                    cts.Token
                );

            var responseText =
                await response.Content
                    .ReadAsStringAsync(
                        cts.Token
                    );

            Console.WriteLine(
                $"Ollama HTTP status: {(int)response.StatusCode}"
            );

            // =================================================
            // ERROR
            // =================================================

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(
                    $"Ollama response: {responseText}"
                );

                throw new HttpRequestException(
                    $"Ollama returned {(int)response.StatusCode}: {responseText}"
                );
            }

            // =================================================
            // PARSE RESPONSE
            // =================================================

            using var jsonDocument =
                JsonDocument.Parse(
                    responseText
                );

            if (!jsonDocument.RootElement.TryGetProperty(
                    "response",
                    out var answer))
            {
                throw new Exception(
                    "Ollama response does not contain 'response'."
                );
            }

            var result =
                answer.GetString();

            if (string.IsNullOrWhiteSpace(result))
            {
                throw new Exception(
                    "Ollama returned an empty response."
                );
            }

            Console.WriteLine(
                $"Ollama response length: {result.Length}"
            );

            Console.WriteLine(
                "Ollama response received successfully."
            );

            Console.WriteLine(
                "----------------------------------------------"
            );

            return result.Trim();
        }

        // =====================================================
        // QUIZ PROMPT
        // =====================================================

        private static string BuildQuizPrompt(
            int count,
            string difficulty)
        {
            // IMPORTANT:
            // Normal string instead of interpolated raw JSON string
            // avoids CS9006 / CS1733 caused by JSON braces.

            var prompt =
                "Create exactly " + count +
                " multiple-choice questions from the DOCUMENT.\n\n" +

                "Difficulty: " + difficulty + "\n\n" +

                "Return ONLY valid JSON.\n\n" +

                "Required JSON structure:\n\n" +

                "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"question\": \"Question text\",\n" +
                "      \"options\": [\n" +
                "        \"Option A\",\n" +
                "        \"Option B\",\n" +
                "        \"Option C\",\n" +
                "        \"Option D\"\n" +
                "      ],\n" +
                "      \"correctAnswer\": \"Option A\",\n" +
                "      \"explanation\": \"Short explanation\"\n" +
                "    }\n" +
                "  ]\n" +
                "}\n\n" +

                "STRICT RULES:\n\n" +

                "- Exactly " + count + " questions.\n" +
                "- Exactly 4 options per question.\n" +
                "- correctAnswer must be one of the options.\n" +
                "- Questions must come ONLY from the DOCUMENT.\n" +
                "- Do not use outside knowledge.\n" +
                "- Keep questions short.\n" +
                "- Keep explanations short.\n" +
                "- Return valid JSON only.";

            return prompt;
        }

        // =====================================================
        // CLEAN JSON RESPONSE
        // =====================================================

        private static string CleanJsonResponse(
            string response)
        {
            if (string.IsNullOrWhiteSpace(response))
            {
                throw new JsonException(
                    "Empty AI response."
                );
            }

            response =
                response.Trim();

            // -------------------------------------------------
            // REMOVE MARKDOWN CODE FENCES
            // -------------------------------------------------

            if (response.StartsWith("```"))
            {
                var firstNewLine =
                    response.IndexOf('\n');

                if (firstNewLine >= 0)
                {
                    response =
                        response.Substring(
                            firstNewLine + 1
                        );
                }

                var lastFence =
                    response.LastIndexOf("```");

                if (lastFence >= 0)
                {
                    response =
                        response.Substring(
                            0,
                            lastFence
                        );
                }
            }

            response =
                response.Trim();

            // -------------------------------------------------
            // EXTRACT JSON OBJECT
            // -------------------------------------------------

            var firstBrace =
                response.IndexOf('{');

            var lastBrace =
                response.LastIndexOf('}');

            if (firstBrace >= 0 &&
                lastBrace > firstBrace)
            {
                response =
                    response.Substring(
                        firstBrace,
                        lastBrace - firstBrace + 1
                    );
            }

            response =
                response.Trim();

            return response;
        }

        // =====================================================
        // AUDIT LOG
        // =====================================================

        private async Task CreateAuditLogAsync(
            string action,
            string category,
            string target,
            string description,
            string status)
        {
            try
            {
                // -------------------------------------------------
                // USER ID
                // -------------------------------------------------

                var rawUserId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    )
                    ?? User.FindFirstValue("sub")
                    ?? User.FindFirstValue("userId");

                if (!Guid.TryParse(
                        rawUserId,
                        out var userId)
                    || userId == Guid.Empty)
                {
                    Console.WriteLine(
                        $"AuditLog skipped: JWT user ID missing for '{action}'."
                    );

                    return;
                }

                // -------------------------------------------------
                // USER NAME
                // -------------------------------------------------

                var userName =
                    User.FindFirstValue(
                        ClaimTypes.Name
                    )
                    ?? User.FindFirstValue("name")
                    ?? User.FindFirstValue("unique_name")
                    ?? User.FindFirstValue("email")
                    ?? "User";

                // -------------------------------------------------
                // INTERNAL API KEY
                // -------------------------------------------------

                var internalApiKey =
                    _configuration["InternalApiKey"];

                if (string.IsNullOrWhiteSpace(
                        internalApiKey))
                {
                    Console.WriteLine(
                        "AuditLog skipped: InternalApiKey missing."
                    );

                    return;
                }

                // -------------------------------------------------
                // REQUEST INFO
                // -------------------------------------------------

                var ipAddress =
                    HttpContext.Connection
                        .RemoteIpAddress?
                        .ToString();

                var userAgent =
                    Request.Headers["User-Agent"]
                        .FirstOrDefault();

                // -------------------------------------------------
                // PAYLOAD
                // -------------------------------------------------

                var payload = new
                {
                    userId,
                    userName,
                    action,
                    category,
                    target,
                    description,
                    status,
                    ipAddress,
                    userAgent
                };

                // -------------------------------------------------
                // AUTH SERVICE
                // -------------------------------------------------

                var client =
                    _httpClientFactory.CreateClient(
                        "AuthService"
                    );

                using var auditRequest =
                    new HttpRequestMessage(
                        HttpMethod.Post,
                        "api/AuditLogs/internal"
                    );

                auditRequest.Headers.Add(
                    "X-Internal-Key",
                    internalApiKey
                );

                auditRequest.Content =
                    JsonContent.Create(payload);

                // -------------------------------------------------
                // SEND
                // -------------------------------------------------

                var response =
                    await client.SendAsync(
                        auditRequest
                    );

                if (!response.IsSuccessStatusCode)
                {
                    var body =
                        await response.Content
                            .ReadAsStringAsync();

                    Console.WriteLine(
                        $"AuditLog failed: " +
                        $"{response.StatusCode} - {body}"
                    );
                }
                else
                {
                    Console.WriteLine(
                        $"AuditLog success: {action}"
                    );
                }
            }
            catch (Exception ex)
            {
                // Audit must never break AI operations
                Console.WriteLine(
                    $"AuditLog exception: {ex.Message}"
                );
            }
        }
    }

    // =========================================================
    // DTOs
    // =========================================================

    public class SummaryRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class AskQuestionDto
    {
        public string Text { get; set; } = string.Empty;

        public string Question { get; set; } = string.Empty;
    }

    public class QuizRequestDto
    {
        public string Text { get; set; } = string.Empty;

        public int Count { get; set; } = 5;

        public string Difficulty { get; set; } = "medium";
    }
}