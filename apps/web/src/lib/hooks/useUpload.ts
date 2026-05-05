'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type PresignResponse = {
  success: boolean;
  data: { uploadUrl: string; publicUrl: string; key: string };
};

export function useUpload(): {
  uploadFile: (file: File, folder: 'seedlings' | 'nurseries') => Promise<string>;
  isUploading: boolean;
} {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    file: File,
    folder: 'seedlings' | 'nurseries',
  ): Promise<string> => {
    setIsUploading(true);
    try {
      const { data: presign } = await api.post<PresignResponse>(
        '/api/upload/presign',
        { filename: file.name, contentType: file.type, folder },
      );

      const { uploadUrl, publicUrl } = presign.data;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
