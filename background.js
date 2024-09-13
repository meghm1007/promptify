const API_KEY = "AIzaSyAunWEMMyIBuovYeuFCScx7udLA6x3iS2o";

function callGeminiAPI(systemInstruction, prompt) {
  console.log("Calling Gemini API with prompt:", prompt);
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const data = {
    contents: [
      {
        parts: [
          {
            text: systemInstruction + "\n\n" + prompt,
          },
        ],
      },
    ],
  };

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Received response from Gemini API:", data);
      return data.candidates[0].content.parts[0].text;
    })
    .catch((error) => {
      console.error("Error:", error);
      return { error: error.toString() };
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  if (request.action === "improvePrompt") {
    const systemInstruction =
      "The user has provided this prompt for asking something to LLMs. Improve the prompt text for better results. Do not add any preamble or introduction. Just return the improved prompt. Even if the prompt is vague do not add additional information to it nor delete any information. ";
    callGeminiAPI(systemInstruction, request.prompt)
      .then((response) => {
        console.log("Received response from Gemini API:", response);
        sendResponse({ response: response });
      })
      .catch((error) => {
        console.error("Error calling Gemini API:", error);
        sendResponse({ error: error.toString() });
      });
    return true; // Indicates that the response will be sent asynchronously
  }
});
