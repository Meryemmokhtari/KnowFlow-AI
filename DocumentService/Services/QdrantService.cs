using DocumentService.Interfaces;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace DocumentService.Services
{
    public class QdrantService : IQdrantService
    {
        private readonly QdrantClient _client;

        private const string CollectionName = "knowflow_documents";
        private const ulong VectorSize = 768;

        public QdrantService()
        {
            _client = new QdrantClient(
                "localhost",
                6334
            );
        }

        public async Task CreateCollectionAsync()
        {
            var collections =
                await _client.ListCollectionsAsync();

            if (collections.Contains(CollectionName))
            {
                return;
            }

            await _client.CreateCollectionAsync(
                CollectionName,
                new VectorParams
                {
                    Size = VectorSize,
                    Distance = Distance.Cosine
                }
            );

            Console.WriteLine(
                $"Qdrant collection created: {CollectionName}"
            );
        }

        public async Task StoreEmbeddingAsync(
            Guid documentId,
            float[] embedding,
            string fileName,
            Guid userId)
        {
            if (embedding == null || embedding.Length == 0)
            {
                throw new ArgumentException(
                    "Embedding cannot be empty.",
                    nameof(embedding)
                );
            }

            if (embedding.Length != (int)VectorSize)
            {
                throw new ArgumentException(
                    $"Invalid embedding dimension. Expected {VectorSize}, received {embedding.Length}.",
                    nameof(embedding)
                );
            }

            await CreateCollectionAsync();

            var point = new PointStruct
            {
                Id = new PointId
                {
                    Uuid = documentId.ToString()
                },

                Vectors = embedding,

                Payload =
                {
                    ["documentId"] = documentId.ToString(),
                    ["fileName"] = fileName,
                    ["userId"] = userId.ToString()
                }
            };

            await _client.UpsertAsync(
                CollectionName,
                new[]
                {
                    point
                }
            );

            Console.WriteLine(
                $"Qdrant: embedding stored for document {documentId}"
            );
        }

        public async Task<List<Guid>> SearchSimilarAsync(
            float[] embedding,
            int limit = 5)
        {
            if (embedding == null || embedding.Length == 0)
            {
                return new List<Guid>();
            }

            if (embedding.Length != (int)VectorSize)
            {
                throw new ArgumentException(
                    $"Invalid embedding dimension. Expected {VectorSize}, received {embedding.Length}.",
                    nameof(embedding)
                );
            }

            if (limit <= 0)
            {
                return new List<Guid>();
            }

            await CreateCollectionAsync();

            var results = await _client.QueryAsync(
                collectionName: CollectionName,
                query: embedding,
                limit: (uint)limit
            );

            var documentIds = new List<Guid>();

            foreach (var result in results)
            {
                if (result.Payload.TryGetValue(
                    "documentId",
                    out var value))
                {
                    if (Guid.TryParse(
                        value.StringValue,
                        out var documentId))
                    {
                        documentIds.Add(documentId);
                    }
                }
            }

            return documentIds;
        }
    }
}