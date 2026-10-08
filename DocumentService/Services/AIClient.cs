
using System.Net.Http.Json;

namespace DocumentService.Services
{
    public class AIClient
    {
        private readonly HttpClient _httpClient;

        public AIClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // =====================================
        // GENERATE SUMMARY
        // =====================================

        public async Task<string?> GenerateSummaryAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return null;

            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "api/AI/summary",
                    new
                    {
                        text = text
                    });

                if (!response.IsSuccessStatusCode)
                {
                    return $"AI Summary unavailable: HTTP {(int)response.StatusCode}";
                }

                var result = await response.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(result))
                {
                    return "AI Summary unavailable: Empty response.";
                }

                return result;
            }
            catch (TaskCanceledException)
            {
                return "AI Summary unavailable: AI Service timeout.";
            }
            catch (HttpRequestException ex)
            {
                return $"AI Summary unavailable: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"AI Summary unavailable: {ex.Message}";
            }
        }

        // =====================================
        // ASK QUESTION
        // =====================================

        public async Task<string?> AskQuestionAsync(
            string text,
            string question)
        {
            if (string.IsNullOrWhiteSpace(text))
                return null;

            if (string.IsNullOrWhiteSpace(question))
                return null;

            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "api/AI/ask",
                    new
                    {
                        text = text,
                        question = question
                    });

                if (!response.IsSuccessStatusCode)
                {
                    return $"AI Answer unavailable: HTTP {(int)response.StatusCode}";
                }

                var result = await response.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(result))
                {
                    return "AI Answer unavailable: Empty response.";
                }

                return result;
            }
            catch (TaskCanceledException)
            {
                return "AI Answer unavailable: AI Service timeout.";
            }
            catch (HttpRequestException ex)
            {
                return $"AI Answer unavailable: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"AI Answer unavailable: {ex.Message}";
            }
        }
    }
}
