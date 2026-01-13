import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFileToSupabase = async (fileBuffer, fileName, mimeType, folderName = 'misc') => {
  const { data, error } = await supabase
    .storage
    .from('school-media')
    .upload(`${folderName}/${fileName}`, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase
    .storage
    .from('school-media')
    .getPublicUrl(`${folderName}/${fileName}`);

  return publicUrl;
};