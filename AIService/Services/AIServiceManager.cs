using System.Net.Http.Json;
using AIService.Interfaces;

namespace AIService.Services
{
    public class AIServiceManager : IAIService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public AIServiceManager(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // =========================================================
        // GENERATE SUMMARY
        // =========================================================

        public async Task<string> GenerateSummaryAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "No text provided.";
            }

            Console.WriteLine("Sending document to Ollama...");

            try
            {
                var client =
                    _httpClientFactory.CreateClient("Ollama");

                var model =
                    _configuration["Ollama:Model"]
                    ?? "llama3.2:1b";

                // -------------------------------------------------
                // LIMIT TEXT SIZE
                // -------------------------------------------------

                const int maxChars = 12000;

                var textForSummary =
                    text.Length > maxChars
                        ? text[..maxChars]
                        : text;

                Console.WriteLine(
                    $"Original text length: {text.Length} characters");

                Console.WriteLine(
                    $"Text sent to Ollama: {textForSummary.Length} characters");

                // -------------------------------------------------
                // OLLAMA REQUEST
                // -------------------------------------------------

                var request = new
                {
                    model = model,

                    prompt = $"""
                    You are KnowFlow AI, an intelligent knowledge
                    management assistant.

                    Summarize the following document clearly and
                    professionally.

                    Focus on:
                    - the main purpose
                    - the most important ideas
                    - key information
                    - important technical or business details

                    Do not invent information.

                    Give a concise summary in 3 to 5 sentences.

                    DOCUMENT:
                    {textForSummary}

                    SUMMARY:
                    """,

                    stream = false,

                    options = new
                    {
                        num_predict = 150,
                        temperature = 0.2
                    }
                };

                var response =
                    await client.PostAsJsonAsync(
                        "api/generate",
                        request);

                response.EnsureSuccessStatusCode();

                var result =
                    await response.Content
                        .ReadFromJsonAsync<OllamaResponse>();

                if (result == null ||
                    string.IsNullOrWhiteSpace(result.Response))
                {
                    return "No summary generated.";
                }

                Console.WriteLine(
                    "Summary generated successfully.");

                return result.Response.Trim();
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine(
                    "Ollama summary request timed out.");

                return "AI Summary unavailable: Ollama timeout.";
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine(
                    $"Ollama HTTP error: {ex.Message}");

                return "AI Summary unavailable: Ollama connection error.";
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Ollama error: {ex.Message}");

                return $"AI Summary unavailable: {ex.Message}";
            }
        }

        // =========================================================
        // ASK QUESTION
        // =========================================================

        public async Task<string> AskQuestionAsync(
            string text,
            string question)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "No document text provided.";
            }

            if (string.IsNullOrWhiteSpace(question))
            {
                return "No question provided.";
            }

            Console.WriteLine(
                "Sending question to Ollama...");

            try
            {
                var client =
                    _httpClientFactory.CreateClient("Ollama");

                var model =
                    _configuration["Ollama:Model"]
                    ?? "llama3.2:1b";

                // -------------------------------------------------
                // LIMIT DOCUMENT SIZE
                // -------------------------------------------------

                const int maxChars = 12000;

                var textForQuestion =
                    text.Length > maxChars
                        ? text[..maxChars]
                        : text;

                Console.WriteLine(
                    $"Question: {question}");

                Console.WriteLine(
                    $"Context length: {textForQuestion.Length} characters");

                // -------------------------------------------------
                // OLLAMA REQUEST
                // -------------------------------------------------

                var request = new
                {
                    model = model,

                    prompt = $"""
                    You are KnowFlow AI, an intelligent knowledge
                    management assistant.

                    Answer the user's question using ONLY the
                    information contained in the provided document.

                    Rules:
                    - Do not invent information.
                    - Do not use outside knowledge.
                    - Give a clear and direct answer.
                    - If the answer cannot be found in the document,
                      say exactly:
                      "The information is not available in the provided documents."

                    DOCUMENT:
                    {textForQuestion}

                    QUESTION:
                    {question}

                    ANSWER:
                    """,

                    stream = false,

                    options = new
                    {
                        num_predict = 200,
                        temperature = 0.2
                    }
                };

                var response =
                    await client.PostAsJsonAsync(
                        "api/generate",
                        request);

                response.EnsureSuccessStatusCode();

                var result =
                    await response.Content
                        .ReadFromJsonAsync<OllamaResponse>();

                if (result == null ||
                    string.IsNullOrWhiteSpace(result.Response))
                {
                    return "No answer generated.";
                }

                Console.WriteLine(
                    "Answer generated successfully.");

                return result.Response.Trim();
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine(
                    "Ollama question request timed out.");

                return "AI Answer unavailable: Ollama timeout.";
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine(
                    $"Ollama HTTP error: {ex.Message}");

                return "AI Answer unavailable: Ollama connection error.";
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Ollama error: {ex.Message}");

                return $"AI Answer unavailable: {ex.Message}";
            }
        }
    }

    // =========================================================
    // OLLAMA RESPONSE
    // =========================================================

    public class OllamaResponse
    {
        public string Response { get; set; } = string.Empty;
    }
}