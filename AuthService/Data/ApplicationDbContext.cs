
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // =====================================================
        // TABLES
        // =====================================================

        public DbSet<User> Users { get; set; } = null!;

        public DbSet<Role> Roles { get; set; } = null!;

        public DbSet<Permission> Permissions { get; set; } = null!;

        public DbSet<RolePermission> RolePermissions { get; set; } = null!;

        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        public DbSet<Notification> Notifications { get; set; } = null!;


        // =====================================================
        // MODEL CONFIGURATION
        // =====================================================

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // =================================================
            // ROLE
            // =================================================

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.Property(r => r.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(r => r.Name)
                    .IsUnique();
            });


            // =================================================
            // USER
            // =================================================

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);

                entity.Property(u => u.FirstName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.LastName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.HasIndex(u => u.Email)
                    .IsUnique();

                entity.Property(u => u.PasswordHash)
                    .IsRequired();

                entity.Property(u => u.IsActive)
                    .IsRequired();

                entity.Property(u => u.CreatedAt)
                    .IsRequired();

                // USER -> ROLE
                entity.HasOne(u => u.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(u => u.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });


            // =================================================
            // PERMISSION
            // =================================================

            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(p => p.Id);

                entity.Property(p => p.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(p => p.Name)
                    .IsUnique();
            });


            // =================================================
            // ROLE PERMISSION
            // =================================================

            modelBuilder.Entity<RolePermission>(entity =>
            {
                // Composite Primary Key
                entity.HasKey(rp => new
                {
                    rp.RoleId,
                    rp.PermissionId
                });

                // ROLE -> ROLE PERMISSIONS
                entity.HasOne(rp => rp.Role)
                    .WithMany(r => r.RolePermissions)
                    .HasForeignKey(rp => rp.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);

                // PERMISSION -> ROLE PERMISSIONS
                entity.HasOne(rp => rp.Permission)
                    .WithMany(p => p.RolePermissions)
                    .HasForeignKey(rp => rp.PermissionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });


            // =================================================
            // AUDIT LOG
            // =================================================

            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(a => a.Id);

                entity.Property(a => a.UserId)
                    .HasMaxLength(100);

                entity.Property(a => a.UserName)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(a => a.Action)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(a => a.Category)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(a => a.Target)
                    .HasMaxLength(255);

                entity.Property(a => a.Description)
                    .HasMaxLength(1000);

                entity.Property(a => a.Status)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.Property(a => a.IpAddress)
                    .HasMaxLength(100);

                entity.Property(a => a.UserAgent)
                    .HasMaxLength(1000);

                entity.Property(a => a.Timestamp)
                    .IsRequired();

                // INDEXES
                entity.HasIndex(a => a.Timestamp);

                entity.HasIndex(a => a.Category);

                entity.HasIndex(a => a.Status);

                entity.HasIndex(a => a.UserId);
            });


            // =================================================
            // NOTIFICATIONS
            // =================================================

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);

                entity.Property(n => n.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(n => n.Message)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(n => n.Type)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(n => n.IsRead)
                    .IsRequired();

                entity.Property(n => n.CreatedAt)
                    .IsRequired();

                // INDEXES
                entity.HasIndex(n => n.UserId);

                entity.HasIndex(n => n.CreatedAt);

                entity.HasIndex(n => new
                {
                    n.UserId,
                    n.IsRead
                });
            });
        }
    }
}
