using DocumentService.Interfaces;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace DocumentService.Services
{
    public class EmbeddingService : IEmbeddingService
    {
        private readonly HttpClient _httpClient;

        public EmbeddingService(IHttpClientFactory httpClientFactory)
        {
            _httpClient =
                httpClientFactory.CreateClient("OllamaEmbedding");
        }

        public async Task<float[]> GenerateEmbeddingAsync(
            string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new ArgumentException(
                    "Text cannot be empty.");
            }

            var request = new EmbeddingRequest
            {
                Model = "nomic-embed-text",
                Prompt = text
            };

            Console.WriteLine(
                $"Generating embedding for {text.Length} characters...");

            var response =
                await _httpClient.PostAsJsonAsync(
                    "api/embeddings",
                    request);

            response.EnsureSuccessStatusCode();

            var result =
                await response.Content
                    .ReadFromJsonAsync<EmbeddingResponse>();

            if (result == null ||
                result.Embedding == null ||
                result.Embedding.Length == 0)
            {
                throw new InvalidOperationException(
                    "Ollama returned an empty embedding.");
            }

            Console.WriteLine(
                $"Embedding generated: {result.Embedding.Length} dimensions.");

            return result.Embedding;
        }

        private class EmbeddingRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = string.Empty;

            [JsonPropertyName("prompt")]
            public string Prompt { get; set; } = string.Empty;
        }

        private class EmbeddingResponse
        {
            [JsonPropertyName("embedding")]
            public float[] Embedding { get; set; } = Array.Empty<float>();
        }
    }
}