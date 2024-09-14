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
loadingText.innerText = "Loading...";
loadingText.style.display = "none";
document.body.appendChild(loadingText);

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
    const promptText = promptTextarea.innerText.trim();
    if (promptText) {
      // Show loading text and hide tooltip
      loadingText.style.display = "block";
      tooltip.style.display = "none";

      chrome.runtime.sendMessage(
        { action: "improvePrompt", prompt: promptText },
        (response) => {
          // Hide loading text and show tooltip after response is received
          loadingText.style.display = "none";
          tooltip.style.display = "block";

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
