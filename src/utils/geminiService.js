/**
 * Helper function to convert File to base64 string
 * @param {File} file - The image file
 * @returns {Promise<string>} - Base64 encoded string without data URL prefix
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calls the Firebase Cloud Function to identify a digit
 * @param {File} file - The image file containing the digit
 * @returns {Promise<string>} - The identified digit
 */
export async function identifyDigit(file) {
  if (!file) {
    throw new Error("No file provided.");
  }

  try {
    // Convert file to base64
    const imageBase64 = await fileToBase64(file);
    
    // Get the function URL from environment variable
    const functionUrl = import.meta.env.VITE_FUNCTION_URL || 'http://127.0.0.1:5001/digit-recognizer-aditya/us-central1/identifyDigit';
    
    // Call the Cloud Function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType: file.type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.digit) {
      throw new Error('No digit returned from server');
    }

    return data.digit;

  } catch (error) {
    console.error('Error calling Cloud Function:', error);
    throw new Error(`Failed to identify digit: ${error.message}`);
  }
}
