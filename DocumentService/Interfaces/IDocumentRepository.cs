
using DocumentService.Models;

namespace DocumentService.Interfaces
{
    public interface IDocumentRepository
    {
        // =====================================
        // GET ALL DOCUMENTS
        // =====================================

        Task<IEnumerable<Document>> GetAllAsync();

        // =====================================
        // GET DOCUMENTS BY USER
        // =====================================

        Task<IEnumerable<Document>> GetByUserIdAsync(
            Guid userId
        );

        // =====================================
        // GET DOCUMENT BY ID
        // =====================================

        Task<Document?> GetByIdAsync(Guid id);

        // =====================================
        // ADD DOCUMENT
        // =====================================

        Task AddAsync(Document document);

        // =====================================
        // DELETE DOCUMENT
        // =====================================

        void Delete(Document document);

        // =====================================
        // SAVE CHANGES
        // =====================================

        Task SaveChangesAsync();
    }
}