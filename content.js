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

// Function to get the appropriate textarea
function getPromptTextarea() {
  // Check for ChatGPT's textarea
  const chatGPTTextarea = document.querySelector("#prompt-textarea");
  if (chatGPTTextarea) return chatGPTTextarea;

  // Check for Perplexity's textarea
  const perplexityTextarea = document.querySelectorAll("textarea")[0];
  if (perplexityTextarea) return perplexityTextarea;

  // If neither is found, return null
  return null;
}

// Add click event listener to the floating button
floatingButton.addEventListener("click", () => {
  const promptTextarea = getPromptTextarea();
  if (promptTextarea) {
    const promptText = promptTextarea.innerText;
    if (promptText) {
      chrome.runtime.sendMessage(
        { action: "improvePrompt", prompt: promptText },
        (response) => {
          if (response.error) {
            alert("Error: " + response.error);
          } else {
            promptTextarea.innerText = response.response; 
            // Trigger input event to ensure the UI updates
            promptTextarea.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      );
    } else {
      alert("Please enter a prompt before clicking the button.");
    }
  } else {
    alert(
      "Prompt textarea not found. Please make sure you're on a supported page (ChatGPT or Perplexity)."
    );
  }
});
