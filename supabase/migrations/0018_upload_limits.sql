-- Uploads: the editor only sends images, compressed to at most 12 MB. Make the
-- storage enforce the same, so the bucket can't be filled with other files by
-- someone calling the API directly.
update storage.buckets
set file_size_limit = 12582912, -- 12 MB
    allowed_mime_types = array['image/*']
where id = 'uploads';
