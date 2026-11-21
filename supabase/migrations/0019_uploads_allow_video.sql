-- Cover videos can now be uploaded from the device. The editor re-encodes them
-- in the browser (scaled down, silent, trimmed), so the file that arrives is a
-- few MB. Allow web video types here and raise the per-file cap to 30 MB so a
-- short clip fits, while still blocking large raw uploads.
update storage.buckets
set file_size_limit = 31457280, -- 30 MB
    allowed_mime_types = array['image/*', 'video/mp4', 'video/webm']
where id = 'uploads';
