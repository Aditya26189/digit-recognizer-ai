const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true }); // Allow all origins for now

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
        "Look at this image of a handwritten digit. Identify the single digit (0-9) written in the image. Return ONLY the digit as a number with no additional text. If there is no digit in the image, return -1.",
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
      ]);

      const digit = result.response.text().trim();
      
      // Check if -1 was returned (no digit found)
      if (digit === "-1" || digit === -1) {
        return res.status(200).json({ digit: "-1" });
      }
      
      // Basic validation for digits 0-9
      const match = digit.match(/\d/);
      const finalDigit = match ? match[0] : "-1";

      return res.status(200).json({ digit: finalDigit });

    } catch (error) {
      console.error("Gemini Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});
