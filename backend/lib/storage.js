// Penyimpanan foto postingan.
// - Online (Vercel): Vercel Blob, aktif otomatis bila BLOB_READ_WRITE_TOKEN tersedia. Yang disimpan di database: URL lengkap.
// - Lokal: folder backend/data/uploads (atau UPLOADS_DIR). Yang disimpan: nama file, disajikan di /uploads/<nama>.
import { randomBytes } from 'node:crypto';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function savePhoto(data, ext, contentType, uploadsDir) {
  const name = `${randomBytes(12).toString('hex')}.${ext}`;
  if (usesBlob()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`posts/${name}`, data, { access: 'public', contentType, addRandomSuffix: false });
    return blob.url;
  }
  mkdirSync(uploadsDir, { recursive: true });
  writeFileSync(join(uploadsDir, name), data);
  return name;
}

export async function removePhoto(photo, uploadsDir) {
  if (!photo) return;
  try {
    if (/^https?:/.test(photo)) {
      if (!usesBlob()) return;
      const { del } = await import('@vercel/blob');
      await del(photo);
    } else {
      unlinkSync(join(uploadsDir, photo));
    }
  } catch (e) {
    console.warn('Hapus foto gagal:', e?.message);
  }
}
