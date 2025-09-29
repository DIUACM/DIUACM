# Media Migration Command

This document explains how to use the media migration command to move files from the S3 'media' disk to the local 'local-media-public' disk.

## Command Usage

### Basic Migration
```bash
php artisan app:migrate-media-to-local
```

### Dry Run (Preview what will be migrated)
```bash
php artisan app:migrate-media-to-local --dry-run
```

### Custom Chunk Size
```bash
php artisan app:migrate-media-to-local --chunk=50
```

## Options

- `--dry-run`: Shows what files would be migrated without actually performing the migration
- `--chunk=N`: Process media files in chunks of N items (default: 100)

## What the Command Does

1. **Finds Media Files**: Searches for all media records in the database that are stored on the 'media' disk (S3)
2. **Copies Files**: Downloads files from S3 and uploads them to the local 'local-media-public' disk 
3. **Updates Database**: Changes the `disk` and `conversions_disk` fields to point to 'local-media-public'
4. **Handles Conversions**: Migrates any image conversions (thumbnails, etc.) that exist
5. **Progress Tracking**: Shows a progress bar and summary of successful/failed migrations

## Disk Configuration

The command migrates between these filesystem disks defined in `config/filesystems.php`:

**Source**: `media` disk (S3)
```php
'media' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    // ... other S3 config
],
```

**Target**: `local-media-public` disk (Local)
```php
'local-media-public' => [
    'driver' => 'local',
    'root' => storage_path('app/public/media'),
    'url' => env('APP_URL').'/storage/media',
    'visibility' => 'public',
],
```

## Output Example

```
Starting media migration from "media" disk to "local-media-public" disk...
Found 156 media files to migrate.
 156/156 [████████████████████████████] 100%

Migration complete: 156 files migrated successfully.
```

## Error Handling

- Files that don't exist on the source disk will be skipped and reported
- Database records are only updated after successful file copy
- Conversions that fail to migrate won't prevent the main file migration
- Progress continues even if individual files fail

## Testing

The command includes comprehensive tests:

```bash
# Run migration command tests
php artisan test tests/Feature/MigrateMediaToLocalCommandTest.php
```

## File Structure

After migration, files will be stored in:
```
storage/app/public/media/
├── 1/
│   └── filename.jpg
├── 2/
│   └── another-file.png
└── ...
```

And accessible via URLs like:
```
https://your-domain.com/storage/media/1/filename.jpg
```

## Important Notes

1. **Backup First**: Always backup your S3 bucket before running the migration
2. **Storage Link**: Ensure the storage link is created: `php artisan storage:link`
3. **Permissions**: Verify that `storage/app/public/media` is writable
4. **Dry Run**: Use `--dry-run` first to preview the migration
5. **Chunking**: Use smaller chunk sizes if you experience memory issues