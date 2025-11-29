// src/utils/geminiService.js

// Development URL (Emulators) vs Production URL
// After deployment, Firebase gives you a URL like:
// https://analyzeDigit-uc.a.run.app
// For now, we use the emulator URL, then update after deployment

const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL || "http://127.0.0.1:5001/digit-recognizer-aditya/us-central1/analyzeDigit"; 

export async function identifyDigit(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64String = reader.result;
      
      try {
        const response = await fetch(FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Backend analysis failed");
        }

        const data = await response.json();
        resolve(data.digit);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
  });
}
