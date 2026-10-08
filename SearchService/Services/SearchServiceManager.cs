using Qdrant.Client;
using SearchService.Interfaces;
using SearchService.Models;
using System.Net.Http.Json;

namespace SearchService.Services
{
    public class SearchServiceManager : ISearchService
    {
        private const string CollectionName = "knowflow_documents";
        private const int VectorSize = 768;

        private readonly QdrantClient _qdrantClient;
        private readonly IHttpClientFactory _httpClientFactory;

        public SearchServiceManager(
            QdrantClient qdrantClient,
            IHttpClientFactory httpClientFactory)
        {
            _qdrantClient = qdrantClient;
            _httpClientFactory = httpClientFactory;
        }

        // =========================================================
        // SEMANTIC SEARCH
        // =========================================================

        public async Task<List<SearchResult>> SearchAsync(
            string query,
            Guid userId,
            string role,
            int limit,
            string authorizationHeader)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<SearchResult>();
            }

            limit = Math.Clamp(limit, 1, 20);

            role = role?.Trim() ?? string.Empty;

            var isAdmin =
                string.Equals(
                    role,
                    "Admin",
                    StringComparison.OrdinalIgnoreCase);

            Console.WriteLine("======================================");
            Console.WriteLine("SEMANTIC SEARCH");
            Console.WriteLine($"Query  : {query}");
            Console.WriteLine($"UserId : {userId}");
            Console.WriteLine($"Role   : {role}");
            Console.WriteLine($"IsAdmin: {isAdmin}");
            Console.WriteLine($"Limit  : {limit}");
            Console.WriteLine("======================================");

            // =========================================================
            // 1. OLLAMA EMBEDDING
            // =========================================================

            var embeddingClient =
                _httpClientFactory.CreateClient(
                    "OllamaEmbedding");

            HttpResponseMessage embeddingResponse;

            try
            {
                embeddingResponse =
                    await embeddingClient.PostAsJsonAsync(
                        "api/embeddings",
                        new
                        {
                            model = "nomic-embed-text",
                            prompt = query
                        });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"OLLAMA CONNECTION ERROR: {ex.Message}");

                throw new HttpRequestException(
                    "Unable to connect to Ollama embedding service.",
                    ex);
            }

            if (!embeddingResponse.IsSuccessStatusCode)
            {
                var error =
                    await embeddingResponse.Content
                        .ReadAsStringAsync();

                Console.WriteLine(
                    $"OLLAMA ERROR: {embeddingResponse.StatusCode}");

                Console.WriteLine(error);

                throw new HttpRequestException(
                    $"Ollama embedding failed: " +
                    $"{embeddingResponse.StatusCode}");
            }

            var embeddingData =
                await embeddingResponse.Content
                    .ReadFromJsonAsync<
                        OllamaEmbeddingResponse>();

            if (embeddingData?.Embedding == null ||
                embeddingData.Embedding.Count == 0)
            {
                throw new Exception(
                    "Ollama returned an empty embedding.");
            }

            Console.WriteLine(
                $"Embedding size: " +
                $"{embeddingData.Embedding.Count}");

            if (embeddingData.Embedding.Count != VectorSize)
            {
                throw new Exception(
                    $"Invalid embedding size. " +
                    $"Expected {VectorSize}, " +
                    $"got {embeddingData.Embedding.Count}");
            }

            var embedding =
                embeddingData.Embedding.ToArray();

            // =========================================================
            // 2. CHECK QDRANT COLLECTION
            // =========================================================

            var collections =
                await _qdrantClient
                    .ListCollectionsAsync();

            if (!collections.Contains(
                    CollectionName))
            {
                throw new Exception(
                    $"Qdrant collection " +
                    $"'{CollectionName}' does not exist.");
            }

            Console.WriteLine(
                $"Qdrant collection OK: " +
                $"{CollectionName}");

            // =========================================================
            // 3. SEARCH QDRANT
            // =========================================================

            var searchLimit =
                Math.Min(
                    Math.Max(limit * 5, 10),
                    100);

            Console.WriteLine(
                "========== QDRANT QUERY ==========");

            Console.WriteLine(
                $"Collection : {CollectionName}");

            Console.WriteLine(
                $"Vector size: {embedding.Length}");

            Console.WriteLine(
                $"Search limit: {searchLimit}");

            var qdrantResults =
                await _qdrantClient.QueryAsync(
                    collectionName: CollectionName,
                    query: embedding,
                    limit: (uint)searchLimit,
                    payloadSelector: true
                );

            Console.WriteLine(
                $"QDRANT RESULTS COUNT = " +
                $"{qdrantResults.Count}");

            // =========================================================
            // 4. QDRANT DEBUG
            // =========================================================

            Console.WriteLine(
                "========== QDRANT DEBUG ==========");

            foreach (var point in qdrantResults)
            {
                Console.WriteLine(
                    "--------------------------------------");

                Console.WriteLine(
                    $"POINT ID: {point.Id}");

                Console.WriteLine(
                    $"SCORE: {point.Score}");

                if (point.Payload.TryGetValue(
                        "documentId",
                        out var documentIdPayload))
                {
                    Console.WriteLine(
                        $"DOCUMENT ID: " +
                        $"{documentIdPayload.StringValue}");
                }
                else
                {
                    Console.WriteLine(
                        "DOCUMENT ID: MISSING");
                }

                if (point.Payload.TryGetValue(
                        "fileName",
                        out var fileNamePayload))
                {
                    Console.WriteLine(
                        $"FILE NAME: " +
                        $"{fileNamePayload.StringValue}");
                }
                else
                {
                    Console.WriteLine(
                        "FILE NAME: MISSING");
                }

                if (point.Payload.TryGetValue(
                        "userId",
                        out var userIdPayload))
                {
                    Console.WriteLine(
                        $"USER ID: " +
                        $"{userIdPayload.StringValue}");
                }
                else
                {
                    Console.WriteLine(
                        "USER ID: MISSING");
                }
            }

            // =========================================================
            // 5. DOCUMENT SERVICE CLIENT
            // =========================================================

            var documentClient =
                _httpClientFactory.CreateClient(
                    "DocumentService");

            if (!string.IsNullOrWhiteSpace(
                    authorizationHeader))
            {
                documentClient
                    .DefaultRequestHeaders
                    .Remove("Authorization");

                documentClient
                    .DefaultRequestHeaders
                    .TryAddWithoutValidation(
                        "Authorization",
                        authorizationHeader);
            }

            Console.WriteLine(
                "DocumentService client configured.");

            // =========================================================
            // 6. FINAL RESULTS
            // =========================================================

            var results =
                new List<SearchResult>();

            foreach (var point in qdrantResults)
            {
                if (results.Count >= limit)
                {
                    break;
                }

                // =====================================================
                // DOCUMENT ID
                // =====================================================

                if (!point.Payload.TryGetValue(
                        "documentId",
                        out var documentIdValue))
                {
                    Console.WriteLine(
                        "SKIP => documentId missing");

                    continue;
                }

                var documentIdString =
                    documentIdValue.StringValue;

                if (!Guid.TryParse(
                        documentIdString,
                        out var documentId))
                {
                    Console.WriteLine(
                        $"SKIP => Invalid documentId: " +
                        $"{documentIdString}");

                    continue;
                }

                Console.WriteLine(
                    $"DocumentId: {documentId}");

                // =====================================================
                // QDRANT USER ID
                // =====================================================

                Guid? qdrantUserId = null;

                if (point.Payload.TryGetValue(
                        "userId",
                        out var userIdValue))
                {
                    var userIdString =
                        userIdValue.StringValue;

                    if (Guid.TryParse(
                            userIdString,
                            out var parsedUserId))
                    {
                        qdrantUserId =
                            parsedUserId;
                    }
                }

                // =====================================================
                // USER FILTER
                // =====================================================

                if (!isAdmin)
                {
                    // -----------------------------------------------
                    // Non-admin users MUST have a userId in Qdrant
                    // -----------------------------------------------

                    if (!qdrantUserId.HasValue)
                    {
                        Console.WriteLine(
                            "SKIP => userId missing from Qdrant " +
                            "for non-admin user.");

                        continue;
                    }

                    // -----------------------------------------------
                    // Non-admin users can only search their documents
                    // -----------------------------------------------

                    if (qdrantUserId.Value != userId)
                    {
                        Console.WriteLine(
                            $"SKIP => User mismatch. " +
                            $"Qdrant={qdrantUserId.Value}, " +
                            $"Current={userId}");

                        continue;
                    }

                    Console.WriteLine(
                        "USER FILTER => Document belongs " +
                        "to current user.");
                }
                else
                {
                    // -----------------------------------------------
                    // ADMIN
                    // -----------------------------------------------

                    Console.WriteLine(
                        "ADMIN SEARCH => User filter bypassed.");

                    if (qdrantUserId.HasValue)
                    {
                        Console.WriteLine(
                            $"ADMIN => Qdrant document owner: " +
                            $"{qdrantUserId.Value}");
                    }
                    else
                    {
                        Console.WriteLine(
                            "ADMIN => Qdrant userId missing. " +
                            "DocumentService will provide owner.");
                    }
                }

                // =====================================================
                // GET DOCUMENT FROM DOCUMENT SERVICE
                // =====================================================

                HttpResponseMessage documentResponse;

                try
                {
                    Console.WriteLine(
                        $"Calling DocumentService for: " +
                        $"{documentId}");

                    documentResponse =
                        await documentClient.GetAsync(
                            $"api/Document/{documentId}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"DOCUMENT SERVICE ERROR: " +
                        $"{ex.Message}");

                    continue;
                }

                Console.WriteLine(
                    $"DocumentService Status: " +
                    $"{documentResponse.StatusCode}");

                if (!documentResponse.IsSuccessStatusCode)
                {
                    var responseBody =
                        await documentResponse.Content
                            .ReadAsStringAsync();

                    Console.WriteLine(
                        $"DocumentService returned " +
                        $"{documentResponse.StatusCode}");

                    Console.WriteLine(
                        $"Response: {responseBody}");

                    continue;
                }

                // =====================================================
                // READ DOCUMENT
                // =====================================================

                var document =
                    await documentResponse.Content
                        .ReadFromJsonAsync<DocumentDto>();

                if (document == null)
                {
                    Console.WriteLine(
                        "SKIP => Document is null");

                    continue;
                }

                Console.WriteLine(
                    $"Document found: " +
                    $"{document.FileName}");

                Console.WriteLine(
                    $"Document owner: " +
                    $"{document.UserId}");

                // =====================================================
                // FINAL SECURITY CHECK
                // =====================================================

                if (!isAdmin &&
                    document.UserId != userId)
                {
                    Console.WriteLine(
                        $"SKIP => Document user mismatch. " +
                        $"Document={document.UserId}, " +
                        $"Current={userId}");

                    continue;
                }

                if (isAdmin)
                {
                    Console.WriteLine(
                        $"ADMIN ACCESS => Document owner: " +
                        $"{document.UserId}");
                }

                // =====================================================
                // ADD RESULT
                // =====================================================

                results.Add(
                    new SearchResult
                    {
                        DocumentId = document.Id,

                        FileName =
                            document.FileName,

                        Content =
                            document.ExtractedText
                            ?? string.Empty,

                        Score =
                            point.Score
                    });

                Console.WriteLine(
                    $"ADDED => {document.FileName} | " +
                    $"Score={point.Score}");
            }

            // =========================================================
            // 7. FINAL
            // =========================================================

            Console.WriteLine(
                $"FINAL RESULTS COUNT = " +
                $"{results.Count}");

            Console.WriteLine(
                "======================================");

            return results;
        }

        // =============================================================
        // OLLAMA RESPONSE
        // =============================================================

        private class OllamaEmbeddingResponse
        {
            public List<float> Embedding { get; set; } = new();
        }

        // =============================================================
        // DOCUMENT DTO
        // =============================================================

        private class DocumentDto
        {
            public Guid Id { get; set; }

            public Guid UserId { get; set; }

            public string FileName { get; set; } =
                string.Empty;

            public string? ExtractedText { get; set; }
        }
    }
}