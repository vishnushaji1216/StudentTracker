import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase credentials in .env");
}

// Create Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'school-media';

/**
 * Upload File to Supabase Storage
 */
export const uploadFileToSupabase = async (
  fileBuffer,
  fileName,
  mimeType,
  folderName = 'misc'
) => {
  const path = `${folderName}/${fileName}`;

  const { error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrl;
};

/**
 * Delete File from Supabase Storage
 */
export const deleteFileFromSupabase = async (publicUrl) => {
  if (!publicUrl) return;

  /**
   * Extract path from public URL
   * Example:
   *   https://xyz.supabase.co/storage/v1/object/public/school-media/folder/file.png
   * Becomes:
   *   folder/file.png
   */
  const splitIndex = publicUrl.indexOf(`${BUCKET_NAME}/`);
  if (splitIndex === -1) {
    console.error("❌ Invalid Supabase URL format:", publicUrl);
    return;
  }

  const path = publicUrl.substring(splitIndex + `${BUCKET_NAME}/`.length);

  // Delete the file
  const { error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) console.error("❌ Supabase Delete Error:", error);
  else console.log(`🗑️ Successfully deleted: ${path}`);
};
