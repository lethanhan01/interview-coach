import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MEDIA_STORAGE_TOKEN } from './media-storage.interface';
import { SupabaseMediaStorageAdapter } from './supabase-media-storage.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MEDIA_STORAGE_TOKEN,
      useClass: SupabaseMediaStorageAdapter,
    },
  ],
  exports: [MEDIA_STORAGE_TOKEN],
})
export class StorageModule {}
