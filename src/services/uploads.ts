import { api } from './api';

export const uploadsService = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string }>('/upload/image', formData);
  },
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string }>('/upload/video', formData);
  },
  uploadMaterial: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string; originalName: string }>('/upload/material', formData);
  },
};
