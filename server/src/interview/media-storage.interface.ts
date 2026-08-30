export const MEDIA_STORAGE_TOKEN = Symbol('MEDIA_STORAGE_TOKEN');

export interface UploadedMediaFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface StoredMediaResult {
  mediaKey: string;
  audioSizeBytes: number;
  audioFileUrl: string; // Pre-signed or accessible URL
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresInSeconds: number;
}

export interface IPrivateMediaStorage {
  /**
   * Uploads media to private object storage and returns metadata with a signed access URL.
   */
  upload(params: {
    path: string;
    file: UploadedMediaFile;
  }): Promise<StoredMediaResult>;

  /**
   * Generates a pre-signed temporary download/streaming URL for a private media key.
   */
  createSignedUrl(
    mediaKey: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult>;

  /**
   * Deletes a file from storage by media key.
   */
  delete(mediaKey: string): Promise<void>;
}
