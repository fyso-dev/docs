---
sidebar_position: 10
---

# File Storage

Files are attached to record fields of type `file`. Each file is stored in tenant-isolated storage with path traversal protection built in.

## Field configuration

Add a file field to your entity schema:

```json
{
  "fieldType": "file",
  "config": {
    "accept": ["image/png", "image/jpeg", "application/pdf"],
    "maxSize": 5242880,
    "multiple": false
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | string[] | all types | Allowed MIME types |
| `maxSize` | number | no limit | Max bytes per file |
| `multiple` | boolean | `false` | Allow multiple files on a single field |

All three options are optional. Without `accept`, any file type is allowed.

## Uploading files

### Via MCP

**MCP Tool: `upload_file`** (Profile: core)

Upload from a URL:

```
upload_file({
  entityName: "contacts",
  recordId: "rec_123",
  fieldKey: "avatar",
  url: "https://example.com/photo.jpg"
})
```

Upload from base64:

```
upload_file({
  entityName: "contacts",
  recordId: "rec_123",
  fieldKey: "avatar",
  base64: "iVBORw0KGgo...",
  fileName: "photo.jpg",
  mimeType: "image/jpeg"
})
```

When uploading from base64, `fileName` and `mimeType` are required.

### Via REST API

```bash
curl -X POST https://api.fyso.dev/api/files/contacts/rec_123/avatar \
  -H "Authorization: Bearer <token>" \
  -F "file=@photo.jpg"
```

Uses `multipart/form-data`. The file is validated against the field's `accept` and `maxSize` config.

## Downloading files

```bash
curl https://api.fyso.dev/api/files/<key>
```

Downloads are public. Images and PDFs are served inline (displayed in the browser). Other types trigger a download.

The `<key>` is the full storage path returned when the file was uploaded.

## Deleting files

```bash
curl -X DELETE https://api.fyso.dev/api/files/<key> \
  -H "Authorization: Bearer <token>"
```

Deletion is immediate. The file is removed from storage and the record field is cleared.

## Storage path

Files are stored at:

```
{tenantSlug}/{entityName}/{recordId}/{fieldKey}/{uuid}.{ext}
```

Each file gets a unique UUID — uploading a new file to the same field doesn't overwrite the old one. Delete explicitly if you need to replace.

## Limits

| Limit | Value |
|-------|-------|
| Max upload size | 10 MB per request |
| MIME validation | Checked against field `accept` config |
| Size validation | Checked against field `maxSize` config |
| Path traversal | Blocked — storage paths are sanitized |

## Example: profile avatar upload and display

```bash
# Upload an avatar
curl -X POST https://api.fyso.dev/api/files/contacts/rec_123/avatar \
  -H "Authorization: Bearer <token>" \
  -F "file=@photo.jpg"

# Response includes the file key
# { "success": true, "data": { "key": "my-app/contacts/rec_123/avatar/a1b2c3.jpg", ... } }

# Display the avatar (public URL, no auth needed)
curl https://api.fyso.dev/api/files/my-app/contacts/rec_123/avatar/a1b2c3.jpg
```
