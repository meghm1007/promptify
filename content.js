// Content script for Promptify
// Injects UI elements and handles interactions with AI platforms

// Create the floating button
const floatingButton = document.createElement("button");
floatingButton.id = "floating-button";
floatingButton.innerHTML = "✨";
document.body.appendChild(floatingButton);

// Create tooltip for instructions
const tooltip = document.createElement("div");
tooltip.id = "floating-button-tooltip";
tooltip.innerText = "Click to improve your prompt!";
document.body.appendChild(tooltip);

// Create loading text element
const loadingText = document.createElement("div");
loadingText.id = "floating-button-loading";
loadingText.innerText = "Enhancing...";
loadingText.style.display = "none";
document.body.appendChild(loadingText);

// Check if enhancement feature is enabled
chrome.storage.local.get(['enhancerEnabled'], function(result) {
  // Default to enabled if the setting doesn't exist yet
  const isEnabled = result.enhancerEnabled === undefined ? true : result.enhancerEnabled;
  
  if (!isEnabled) {
    // Hide the button if enhancement is disabled
    floatingButton.style.display = 'none';
    tooltip.style.display = 'none';
  }
});

// Listen for changes to the enhancer setting
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enhancerEnabled) {
    if (changes.enhancerEnabled.newValue) {
      floatingButton.style.display = 'block';
    } else {
      floatingButton.style.display = 'none';
      tooltip.style.display = 'none';
    }
  }
});

// Function to get the appropriate textarea based on the current platform
function getPromptTextarea() {
  // ChatGPT
  const chatGPTTextarea = document.querySelector("#prompt-textarea");
  if (chatGPTTextarea) return chatGPTTextarea;

  // Claude.ai
  const claudeTextarea = document.querySelector(".ProseMirror");
  if (claudeTextarea) return claudeTextarea;

  // Perplexity
  const perplexityTextarea = document.querySelector("[contenteditable='true']");
  if (perplexityTextarea) return perplexityTextarea;

  // Poe
  const poeTextarea = document.querySelector("textarea.GrowingTextArea");
  if (poeTextarea) return poeTextarea;
  
  // Bard/Gemini
  const bardTextarea = document.querySelector("input[placeholder]");
  if (bardTextarea) return bardTextarea;

  // If none found, return null
  return null;
}

// Function to set text in the textarea (considering different platforms)
function setTextInTextarea(textarea, text) {
  if (!textarea) return false;
  
  // For standard textareas
  if (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT') {
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  
  // For contenteditable divs (Claude, Perplexity)
  if (textarea.getAttribute('contenteditable') === 'true' || textarea.classList.contains('ProseMirror')) {
    textarea.innerHTML = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  
  return false;
}

// Add click event listener to the floating button
floatingButton.addEventListener("click", () => {
  const promptTextarea = getPromptTextarea();
  
  if (!promptTextarea) {
    alert("Prompt textarea not found. Please make sure you're on a supported page (ChatGPT, Claude, etc.).");
    return;
  }
  
  let promptText = '';
  
  // Get text based on element type
  if (promptTextarea.tagName === 'TEXTAREA' || promptTextarea.tagName === 'INPUT') {
    promptText = promptTextarea.value;
  } else if (promptTextarea.getAttribute('contenteditable') === 'true' || promptTextarea.classList.contains('ProseMirror')) {
    promptText = promptTextarea.textContent || promptTextarea.innerText;
  }
  
  if (!promptText.trim()) {
    alert("Please enter a prompt before clicking the button.");
    return;
  }
  
  // Show loading state
  loadingText.style.display = "block";
  tooltip.style.display = "none";

  // Send to background script for processing
  chrome.runtime.sendMessage(
    {
      action: "improvePrompt",
      prompt: promptText,
    },
    (response) => {
      // Hide loading state
      loadingText.style.display = "none";
      tooltip.style.display = "block";

      if (response.error) {
        alert("Error: " + response.error);
      } else {
        const improvedPrompt = response.response;
        const success = setTextInTextarea(promptTextarea, improvedPrompt);
        
        if (!success) {
          // If setting text failed, offer to copy to clipboard
          navigator.clipboard.writeText(improvedPrompt).then(() => {
            alert("Couldn't automatically insert the improved prompt. It has been copied to your clipboard instead.");
          });
        }
      }
    }
  );
});
