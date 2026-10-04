import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MEDIA_STORAGE_TOKEN } from './media-storage.interface';
import { LocalDiskMediaStorageAdapter } from './local-disk-media-storage.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MEDIA_STORAGE_TOKEN,
      useClass: LocalDiskMediaStorageAdapter,
    },
    LocalDiskMediaStorageAdapter,
  ],
  exports: [MEDIA_STORAGE_TOKEN, LocalDiskMediaStorageAdapter],
})
export class StorageModule {}
