import { api } from './api';

export type UploadProgressHandler = (percent: number) => void;

interface VideoPresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export const uploadsService = {
  uploadImage: (file: File, onProgress?: UploadProgressHandler) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string }>('/upload/image', formData, onProgress);
  },

  /**
   * Uploads an mp4 straight from the browser to R2 via a presigned PUT URL.
   * Two network legs:
   *   1. POST /upload/video/presign  (tiny, through the API)
   *   2. PUT  <presigned R2 url>     (the big one, directly to R2)
   *
   * The backend never sees the bytes. The onProgress callback reports the
   * second leg (the one that matters) so a 150 MB upload shows real progress
   * from 0 → 100 % instead of hanging behind nginx + node memory.
   *
   * Returns { url } with the public URL of the uploaded object, matching the
   * shape of the old multer-backed endpoint so callers don't need to change.
   */
  uploadVideo: async (
    file: File,
    onProgress?: UploadProgressHandler,
  ): Promise<{ url: string }> => {
    if (file.type && file.type !== 'video/mp4') {
      throw new Error('Solo se permiten archivos MP4.');
    }
    if (file.size > 500 * 1024 * 1024) {
      throw new Error('El video supera los 500 MB.');
    }

    const { uploadUrl, publicUrl } = await api.post<VideoPresignResponse>(
      '/upload/video/presign',
      {
        filename: file.name,
        contentType: 'video/mp4',
        size: file.size,
      },
    );

    // The presigned URL was signed with Content-Type: video/mp4, so we must
    // send that exact header on the PUT — some browsers default File.type to
    // an empty string, which would cause SignatureDoesNotMatch.
    await api.putBlob(uploadUrl, file, 'video/mp4', onProgress);

    return { url: publicUrl };
  },

  uploadMaterial: (file: File, onProgress?: UploadProgressHandler) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string; originalName: string }>('/upload/material', formData, onProgress);
  },
};
