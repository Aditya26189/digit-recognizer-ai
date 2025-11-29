import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Converts a File object to a Google Generative AI compatible part.
 * @param {File} file - The image file to convert.
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>}
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,") to get pure base64
      const base64String = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Identifies a handwritten digit from an image file using Google Gemini API.
 * @param {File} file - The image file containing the digit.
 * @returns {Promise<string>} - The identified digit.
 * @throws {Error} - If analysis fails or configuration is missing.
 */
export async function identifyDigit(file) {
  if (!API_KEY) {
    throw new Error("API key not configured. Please set VITE_GEMINI_API_KEY.");
  }

  if (!file) {
    throw new Error("No file provided.");
  }

  try {
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare image data
    const imagePart = await fileToGenerativePart(file);

    // Prompt engineering
    const prompt = "Look at this image of a handwritten digit. Identify the single digit (0-9) written in the image. Return ONLY the digit as a number with no additional text, explanation, or punctuation.";

    // Call API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No digit detected in image");
    }

    // Clean the response: remove whitespace and non-digit characters
    const cleanedText = text.trim().replace(/\D/g, '');

    if (cleanedText.length === 0) {
      throw new Error("Invalid response from API: No digits found");
    }

    // Return the identified digit(s)
    return cleanedText;

  } catch (error) {
    console.error("Gemini Service Error:", error);
    // Re-throw with a user-friendly message if it's not already one of our custom errors
    if (error.message.includes("API key") || error.message.includes("No file") || error.message.includes("No digit") || error.message.includes("Invalid response")) {
      throw error;
    }
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}
