
using DocumentService.Data;
using DocumentService.Interfaces;
using DocumentService.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentService.Repositories
{
    public class DocumentRepository : IDocumentRepository
    {
        private readonly ApplicationDbContext _context;

        public DocumentRepository(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================
        // GET ALL DOCUMENTS
        // =====================================

        public async Task<IEnumerable<Document>> GetAllAsync()
        {
            return await _context.Documents
                .AsNoTracking()
                .ToListAsync();
        }

        // =====================================
        // GET DOCUMENTS BY USER
        // =====================================

        public async Task<IEnumerable<Document>> GetByUserIdAsync(
            Guid userId)
        {
            return await _context.Documents
                .AsNoTracking()
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();
        }

        // =====================================
        // GET DOCUMENT BY ID
        // =====================================

        public async Task<Document?> GetByIdAsync(Guid id)
        {
            return await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        // =====================================
        // ADD DOCUMENT
        // =====================================

        public async Task AddAsync(Document document)
        {
            await _context.Documents.AddAsync(document);
        }

        // =====================================
        // DELETE DOCUMENT
        // =====================================

        public void Delete(Document document)
        {
            _context.Documents.Remove(document);
        }

        // =====================================
        // SAVE CHANGES
        // =====================================

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}