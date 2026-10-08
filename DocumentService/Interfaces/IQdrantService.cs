namespace DocumentService.Interfaces
{
    public interface IQdrantService
    {
        Task CreateCollectionAsync();

        Task StoreEmbeddingAsync(
            Guid documentId,
            float[] embedding,
            string fileName,
            Guid userId
        );

        Task<List<Guid>> SearchSimilarAsync(
            float[] embedding,
            int limit = 5
        );
    }
}