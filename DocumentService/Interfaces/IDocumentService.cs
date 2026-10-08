
using DocumentService.DTOs;

namespace DocumentService.Interfaces
{
    public interface IDocumentService
    {
        // =====================================
        // GET USER DOCUMENTS
        // =====================================

        Task<IEnumerable<DocumentDto>> GetAllAsync(
            Guid userId
        );

        // =====================================
        // GET DOCUMENT BY ID
        // =====================================

        Task<DocumentDto?> GetByIdAsync(
            Guid id
        );

        // =====================================
        // CREATE DOCUMENT
        // =====================================

        Task<DocumentDto> CreateAsync(
            CreateDocumentDto dto
        );

        // =====================================
        // ASK QUESTION ABOUT DOCUMENT
        // =====================================

        Task<string?> AskQuestionAsync(
            Guid documentId,
            string question
        );

        // =====================================
        // DELETE DOCUMENT
        // =====================================

        Task DeleteAsync(
            Guid id
        );
    }
}
