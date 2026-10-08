
using DocumentService.Controllers;
using DocumentService.DTOs;
using DocumentService.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System.Runtime.Intrinsics.Arm;
using System.Security.Claims;

namespace DocumentService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly ITextExtractionService _textExtractionService;

        public DocumentController(
            IDocumentService documentService,
            ITextExtractionService textExtractionService)
        {
            _documentService = documentService;
            _textExtractionService = textExtractionService;
        }

        // =====================================================
        // JWT USER ID
        // =====================================================

        private Guid? GetCurrentUserId()
        {
            var rawUserId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue("userId");

            if (Guid.TryParse(rawUserId, out var userId)
                && userId != Guid.Empty)
            {
                return userId;
            }

            return null;
        }

        // =====================================================
        // JWT USER NAME
        // =====================================================

        private string GetCurrentUserName()
        {
            return
                User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue("name")
                ?? User.FindFirstValue("unique_name")
                ?? User.FindFirstValue("email")
                ?? "User";
        }

        // =====================================================
        // JWT USER ROLE
        // =====================================================

        private string GetCurrentUserRole()
        {
            return
                User.FindFirstValue(ClaimTypes.Role)
                ?? User.FindFirstValue("role")
                ?? string.Empty;
        }

        // =====================================================
        // CHECK ADMIN ROLE
        // =====================================================

        private bool IsAdmin()
        {
            var role = GetCurrentUserRole();

            return string.Equals(
                role.Trim(),
                "Admin",
                StringComparison.OrdinalIgnoreCase
            );
        }

        // =====================================================
        // CHECK DOCUMENT OWNERSHIP
        // =====================================================

        private bool IsDocumentOwner(
            DocumentDto document,
            Guid currentUserId)
        {
            return document.UserId == currentUserId;
        }

        // =====================================================
        // GET ALL DOCUMENTS
        // =====================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentDto>>> GetAll()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            try
            {
                // =================================================
                // SECURITY:
                // Return only documents belonging
                // to the authenticated user.
                //
                // Admin global listing can be handled separately
                // if needed by the Admin dashboard.
                // =================================================

                var documents =
                    await _documentService.GetAllAsync(
                        currentUserId.Value
                    );

                return Ok(documents);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Get documents error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Error loading documents.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET DOCUMENT BY ID
        // =====================================================

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<DocumentDto>> GetById(
            Guid id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            try
            {
                // =================================================
                // GET DOCUMENT
                // =================================================

                var document =
                    await _documentService.GetByIdAsync(id);

                if (document == null)
                {
                    return NotFound(new
                    {
                        message = "Document not found."
                    });
                }

                // =================================================
                // ADMIN ACCESS
                // =================================================
                // Admin can access any document.
                // This is required for global semantic search.
                // =================================================

                if (IsAdmin())
                {
                    Console.WriteLine(
                        $"ADMIN ACCESS => Document {id}"
                    );

                    Console.WriteLine(
                        $"ADMIN => Document owner: {document.UserId}"
                    );

                    return Ok(document);
                }

                // =================================================
                // NORMAL USER ACCESS
                // =================================================
                // Manager / Employee / Enseignant / Étudiant
                // can access only their own document.
                // =================================================

                if (!IsDocumentOwner(
                        document,
                        currentUserId.Value))
                {
                    Console.WriteLine(
                        $"ACCESS DENIED => User " +
                        $"{currentUserId.Value} tried to access " +
                        $"document {id}"
                    );

                    return Forbid();
                }

                return Ok(document);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Get document by ID error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Error loading document.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // CREATE DOCUMENT
        // =====================================================

        [HttpPost]
        public async Task<ActionResult<DocumentDto>> Create(
            [FromBody] CreateDocumentDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message = "Document data is required."
                });
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            try
            {
                // =================================================
                // SECURITY:
                // NEVER TRUST USER ID FROM FRONTEND.
                // Always use the authenticated JWT user.
                // =================================================

                dto.UserId =
                    currentUserId.Value;

                var document =
                    await _documentService.CreateAsync(dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new
                    {
                        id = document.Id
                    },
                    document
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Create document error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Error creating document.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // UPLOAD DOCUMENT
        // =====================================================

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<DocumentDto>> Upload(
            IFormFile file)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "No file selected."
                });
            }

            try
            {
                // =================================================
                // UPLOADS FOLDER
                // =================================================

                var uploadsFolder =
                    Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "Uploads"
                    );

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(
                        uploadsFolder
                    );
                }

                // =================================================
                // FILE EXTENSION VALIDATION
                // =================================================

                var extension =
                    Path.GetExtension(
                        file.FileName
                    ).ToLowerInvariant();

                var allowedExtensions =
                    new[]
                    {
                        ".pdf",
                        ".docx",
                        ".txt"
                    };

                if (!allowedExtensions.Contains(
                    extension))
                {
                    return BadRequest(new
                    {
                        message =
                            "Unsupported file type. " +
                            "Allowed: PDF, DOCX, TXT."
                    });
                }

                // =================================================
                // GENERATE UNIQUE FILE NAME
                // =================================================

                var uniqueFileName =
                    $"{Guid.NewGuid()}{extension}";

                var filePath =
                    Path.Combine(
                        uploadsFolder,
                        uniqueFileName
                    );

                // =================================================
                // SAVE PHYSICAL FILE
                // =================================================

                await using (
                    var stream =
                        new FileStream(
                            filePath,
                            FileMode.Create,
                            FileAccess.Write,
                            FileShare.None
                        ))
                {
                    await file.CopyToAsync(stream);
                }

                Console.WriteLine(
                    $"File saved: {filePath}"
                );

                // =================================================
                // EXTRACT TEXT
                // =================================================

                var extractedText =
                    await _textExtractionService
                        .ExtractTextAsync(
                            filePath
                        );

                Console.WriteLine(
                    $"Extracted text length: " +
                    $"{extractedText?.Length ?? 0}"
                );

                // =================================================
                // CREATE DOCUMENT DTO
                // =================================================

                var dto =
                    new CreateDocumentDto
                    {
                        // UserId comes from JWT.

                        UserId =
                            currentUserId.Value,

                        FileName =
                            file.FileName,

                        FilePath =
                            filePath,

                        FileType =
                            file.ContentType,

                        FileSize =
                            file.Length,

                        ExtractedText =
                            extractedText,

                        Summary = null
                    };

                // =================================================
                // SAVE DOCUMENT
                // =================================================

                var document =
                    await _documentService
                        .CreateAsync(dto);

                return Ok(document);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Upload error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "An error occurred while uploading the document.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // GET FILE
        // =====================================================

        [HttpGet("file/{fileName}")]
        public async Task<IActionResult> GetFile(
            string fileName)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            try
            {
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return BadRequest(new
                    {
                        message = "File name is required."
                    });
                }

                // =================================================
                // SECURITY:
                // Prevent path traversal.
                // =================================================

                fileName =
                    Path.GetFileName(fileName);

                // =================================================
                // CHECK FILE BELONGS TO CURRENT USER
                // =================================================

                var userDocuments =
                    await _documentService
                        .GetAllAsync(
                            currentUserId.Value
                        );

                var document =
                    userDocuments.FirstOrDefault(
                        d =>
                            string.Equals(
                                Path.GetFileName(
                                    d.FilePath ?? string.Empty
                                ),
                                fileName,
                                StringComparison.OrdinalIgnoreCase
                            )
                            ||
                            string.Equals(
                                d.FileName,
                                fileName,
                                StringComparison.OrdinalIgnoreCase
                            )
                    );

                if (document == null)
                {
                    // Do not reveal whether
                    // another user's file exists.

                    return NotFound(new
                    {
                        message = "File not found."
                    });
                }

                // =================================================
                // UPLOADS FOLDER
                // =================================================

                var uploadsFolder =
                    Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "Uploads"
                    );

                var filePath =
                    Path.Combine(
                        uploadsFolder,
                        fileName
                    );

                // =================================================
                // VERIFY PHYSICAL FILE
                // =================================================

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new
                    {
                        message = "File not found.",
                        file = fileName
                    });
                }

                // =================================================
                // CONTENT TYPE
                // =================================================

                var provider =
                    new FileExtensionContentTypeProvider();

                if (!provider.TryGetContentType(
                    filePath,
                    out var contentType))
                {
                    contentType =
                        "application/octet-stream";
                }

                return PhysicalFile(
                    filePath,
                    contentType,
                    enableRangeProcessing: true
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Get file error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Error opening document.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // ASK QUESTION ABOUT DOCUMENT
        // =====================================================

        [HttpPost("{id:guid}/ask")]
        public async Task<IActionResult> AskQuestion(
            Guid id,
            [FromBody] string question)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            if (string.IsNullOrWhiteSpace(question))
            {
                return BadRequest(new
                {
                    message = "Question is required."
                });
            }

            try
            {
                // =================================================
                // GET DOCUMENT
                // =================================================

                var document =
                    await _documentService
                        .GetByIdAsync(id);

                if (document == null)
                {
                    return NotFound(new
                    {
                        message = "Document not found."
                    });
                }

                // =================================================
                // SECURITY:
                // User can only ask questions about
                // his own document.
                // =================================================

                if (!IsDocumentOwner(
                        document,
                        currentUserId.Value))
                {
                    return Forbid();
                }

                // =================================================
                // CHECK EXTRACTED TEXT
                // =================================================

                if (string.IsNullOrWhiteSpace(
                    document.ExtractedText))
                {
                    return BadRequest(new
                    {
                        message =
                            "This document does not contain extracted text."
                    });
                }

                // =================================================
                // ASK AI
                // =================================================

                var answer =
                    await _documentService
                        .AskQuestionAsync(
                            id,
                            question
                        );

                return Ok(new
                {
                    documentId = id,
                    question,
                    answer
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Ask question error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "An error occurred while asking the question.",
                        error = ex.Message
                    }
                );
            }
        }

        // =====================================================
        // DELETE DOCUMENT
        // =====================================================

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(
            Guid id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid or missing JWT user ID."
                });
            }

            try
            {
                // =================================================
                // GET DOCUMENT
                // =================================================

                var document =
                    await _documentService
                        .GetByIdAsync(id);

                if (document == null)
                {
                    return NotFound(new
                    {
                        message = "Document not found."
                    });
                }

                // =================================================
                // SECURITY:
                // User can only delete his own document.
                // =================================================

                if (!IsDocumentOwner(
                        document,
                        currentUserId.Value))
                {
                    return Forbid();
                }

                // =================================================
                // DELETE DATABASE RECORD
                // =================================================

                await _documentService
                    .DeleteAsync(id);

                // =================================================
                // DELETE PHYSICAL FILE
                // =================================================

                if (!string.IsNullOrWhiteSpace(
                    document.FilePath))
                {
                    try
                    {
                        if (System.IO.File.Exists(
                            document.FilePath))
                        {
                            System.IO.File.Delete(
                                document.FilePath
                            );

                            Console.WriteLine(
                                $"Physical file deleted: " +
                                $"{document.FilePath}"
                            );
                        }
                    }
                    catch (Exception fileEx)
                    {
                        Console.WriteLine(
                            $"Could not delete physical file: " +
                            $"{fileEx.Message}"
                        );
                    }
                }

                return Ok(new
                {
                    message =
                        "Document deleted successfully."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Delete document error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Error deleting document.",
                        error = ex.Message
                    }
                );
            }
        }
    }
}
