import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly bucketName =
    process.env.SUPABASE_BUCKET_IMAGES || 'images';

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new InternalServerErrorException(
        'Supabase credentials are not configured',
      );
    }
    this.client = createClient(url, key);
  }

  async uploadPublic(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(filePath, fileBuffer, { contentType, upsert: true });

    if (error) {
      throw new InternalServerErrorException('Upload failed: ' + error.message);
    }

    const {
      data: { publicUrl },
    } = this.client.storage.from(this.bucketName).getPublicUrl(filePath);

    return publicUrl;
  }
}
