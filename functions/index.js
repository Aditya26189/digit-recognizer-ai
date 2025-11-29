const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true });

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.identifyDigit = onRequest(async (req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).send("No image provided");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent([
        "Identify the handwritten digit in this image. Return ONLY the number.",
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg"
          }
        }
      ]);

      const text = result.response.text().trim();
      res.json({ digit: text });

    } catch (error) {
      console.error("Error identifying digit:", error);
      res.status(500).json({ error: error.message });
    }
  });
});
