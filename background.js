// Background Service Worker for Promptify

// Gemini API integration for prompt enhancement
const fineif = "AIzaS";
const feifjie = "yAunW";
const igjeijgieji = "EMMyIBuovYeuF";
const wfifeijfe = "CScx7udLA6x3iS2o";
const ifsjowfjwifnwfwfiwniwn = fineif + feifjie + igjeijgieji + wfifeijfe;

function callGeminiAPI(systemInstruction, prompt) {
  console.log("Calling Gemini API with prompt:", prompt);
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ifsjowfjwifnwfwfiwniwn}`;

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
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response structure from Gemini API");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      return {
        error: error.toString(),
      };
    });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  
  if (request.action === "improvePrompt") {
    // Check if enhancement feature is enabled
    chrome.storage.local.get(['enhancerEnabled'], function(result) {
      // Default to enabled if the setting doesn't exist yet
      const isEnabled = result.enhancerEnabled === undefined ? true : result.enhancerEnabled;
      
      if (!isEnabled) {
        sendResponse({
          error: "Prompt enhancement feature is disabled. Enable it in the extension settings."
        });
        return;
      }
      
      const systemInstruction =
        "The user has provided a prompt for querying LLMs like ChatGPT, Claude, or Perplexity. Create an improved, detailed prompt that will get better results from the AI. Format it as 'You are an expert [relevant expertise] who [relevant qualifications]...' and include specific instructions that will help the AI understand exactly what the user wants. Return only the improved prompt without any additional explanation.";

      callGeminiAPI(systemInstruction, request.prompt)
        .then((response) => {
          console.log("Received response from Gemini API:", response);
          sendResponse({
            response: response,
          });
        })
        .catch((error) => {
          console.error("Error calling Gemini API:", error);
          sendResponse({
            error: error.toString(),
          });
        });
    });
    
    return true; // Indicates that the response will be sent asynchronously
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Promptify extension installed");
  
  // Set default settings if not already set
  chrome.storage.local.get(['enhancerEnabled', 'socialLinks'], function(result) {
    if (result.enhancerEnabled === undefined) {
      chrome.storage.local.set({ enhancerEnabled: true });
    }
    
    if (!result.socialLinks) {
      chrome.storage.local.set({ 
        socialLinks: {
          twitter: "",
          linkedin: "",
          github: "",
          youtube: "",
          website: ""
        }
      });
    }
  });
});
