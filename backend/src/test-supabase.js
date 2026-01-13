import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log("Testing Supabase Upload...");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const runUploadTest = async () => {
    // 1. Create a dummy file buffer (just some text)
    const dummyFile = Buffer.from("Hello Supabase! This is a test file.", 'utf-8');
    const fileName = `test_upload_${Date.now()}.txt`;

    try {
        // 2. Try to Upload to 'school-media' bucket
        const { data, error } = await supabase
            .storage
            .from('school-media')
            .upload(`test/${fileName}`, dummyFile, {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error("❌ Upload Failed!");
            console.error("Error Message:", error.message);
            console.error("Hint: Did you set the Storage Policy to allow INSERT?");
        } else {
            console.log("✅ Upload Successful!");
            console.log("Path:", data.path);
            
            // 3. Get Public URL
            const { data: urlData } = supabase
                .storage
                .from('school-media')
                .getPublicUrl(`test/${fileName}`);
                
            console.log("Public URL:", urlData.publicUrl);
            console.log("---------------------------------------------------");
            console.log("🎉 You are ready to build the Camera Feature!");
        }
    } catch (err) {
        console.error("❌ Script Error:", err);
    }
};

runUploadTest();