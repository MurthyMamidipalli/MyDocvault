import { createClient } from '@supabase/supabase-js';

// Environment variable retrieval with safe fallback defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmcxjeowowpdhkmqyofn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3XCxro5r8LPWlx3sgSxcQA_9ecRjmnB';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Storage Bucket Constants
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  PROFILE_IMAGES: 'profile-images',
  RESUMES: 'resumes',
  CERTIFICATES: 'certificates',
  PROJECTS: 'projects',
} as const;

/**
 * Upload a file directly to Supabase Storage
 */
export async function uploadFileToSupabaseStorage(
  bucket: string,
  userId: string,
  file: File,
  folder = 'general'
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`[Supabase Storage Error] Bucket ${bucket} upload failed:`, error);
      throw error;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (err) {
    console.error('[Supabase Storage Upload Exception]', err);
    return null;
  }
}

/**
 * Get a public URL or signed URL for a file stored in Supabase Storage
 */
export function getSupabaseStorageUrl(bucket: string, path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromSupabaseStorage(bucket: string, path: string): Promise<boolean> {
  try {
    if (!path || path.startsWith('http') || path.startsWith('data:')) return true;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[Supabase Storage Error] Remove ${path} failed:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase Storage Delete Exception]', err);
    return false;
  }
}
