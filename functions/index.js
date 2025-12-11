const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule: scheduleFunction } = require("firebase-functions/v2/scheduler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true }); // Allow all origins for now
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

// 1. Access API Key safely (we'll set this in environment config)
// For hackathon speed, we can use process.env if we deploy with secrets
// Or we can use the secure defineSecret pattern, but let's stick to simple env for now.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.analyzeDigit = onRequest((req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64 || !mimeType) {
        return res.status(400).send("Missing image data");
      }

      // Clean base64 string if needed (remove data:image/png;base64, prefix)
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const result = await model.generateContent([
        "You are a number recognition AI. Look at this image and identify the COMPLETE NUMBER written in it. IMPORTANT: If the image shows '2025', you must return '2025', not just '2'. If it shows '123', return '123', not just '1'. Return the ENTIRE number as shown in the image. Return ONLY the complete number with no additional text, spaces, punctuation, or explanations. If there is no number visible in the image, return -1.",
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
      ]);

      const responseText = result.response.text().trim();
      console.log("Gemini raw response:", responseText);
      
      // Check if -1 was returned (no number found)
      if (responseText === "-1" || responseText === -1) {
        return res.status(200).json({ digit: "-1" });
      }
      
      // Validate that it's a valid number (only digits, no other characters)
      const match = responseText.match(/^\d+$/);
      const finalDigit = match ? responseText : "-1";
      
      console.log("Final digit returned:", finalDigit);
      return res.status(200).json({ digit: finalDigit });

    } catch (error) {
      console.error("Gemini Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Scheduled function to clean up old images (runs daily at 2 AM)
exports.cleanupOldImages = scheduleFunction(
  {
    schedule: "0 2 * * *", // Runs every day at 2:00 AM (cron format)
    timeZone: "America/Los_Angeles", // Adjust to your timezone
  },
  async (event) => {
    console.log("Starting scheduled cleanup of old images...");
    
    const db = admin.firestore();
    const storage = admin.storage();
    const bucket = storage.bucket();
    
    try {
      // Calculate cutoff time (24 hours ago)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      // Query for images older than 1 day
      const oldImagesSnapshot = await db
        .collection("uploadedImages")
        .where("createdAt", "<", oneDayAgo)
        .get();
      
      console.log(`Found ${oldImagesSnapshot.size} images to delete`);
      
      let deleted = 0;
      let failed = 0;
      
      // Delete each image from Storage and Firestore
      for (const doc of oldImagesSnapshot.docs) {
        const data = doc.data();
        
        try {
          // Delete from Storage
          await bucket.file(data.filePath).delete();
          console.log(`Deleted from storage: ${data.filePath}`);
          
          // Delete metadata from Firestore
          await doc.ref.delete();
          console.log(`Deleted metadata: ${doc.id}`);
          
          deleted++;
        } catch (error) {
          console.error(`Failed to delete ${data.filePath}:`, error);
          failed++;
        }
      }
      
      console.log(`Cleanup complete: ${deleted} deleted, ${failed} failed`);
      return { deleted, failed };
      
    } catch (error) {
      console.error("Cleanup error:", error);
      throw error;
    }
  }
);

// Optional: Manual cleanup function that can be called via HTTP
exports.manualCleanup = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    
    console.log("Starting manual cleanup of old images...");
    
    const db = admin.firestore();
    const storage = admin.storage();
    const bucket = storage.bucket();
    
    // Get daysOld from request body, default to 1
    const daysOld = req.body.daysOld || 1;
    
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const oldImagesSnapshot = await db
        .collection("uploadedImages")
        .where("createdAt", "<", cutoffTime)
        .get();
      
      console.log(`Found ${oldImagesSnapshot.size} images to delete`);
      
      let deleted = 0;
      let failed = 0;
      const errors = [];
      
      for (const doc of oldImagesSnapshot.docs) {
        const data = doc.data();
        
        try {
          await bucket.file(data.filePath).delete();
          await doc.ref.delete();
          deleted++;
        } catch (error) {
          console.error(`Failed to delete ${data.filePath}:`, error);
          failed++;
          errors.push({ filePath: data.filePath, error: error.message });
        }
      }
      
      console.log(`Manual cleanup complete: ${deleted} deleted, ${failed} failed`);
      return res.status(200).json({ deleted, failed, errors });
      
    } catch (error) {
      console.error("Manual cleanup error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});
