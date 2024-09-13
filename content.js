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

// Add click event listener to the floating button
floatingButton.addEventListener("click", () => {
  const promptTextarea = document.querySelector("#prompt-textarea");
  if (promptTextarea) {
    const promptText = promptTextarea.innerText // Use trim() to remove whitespace
    if (promptText) {
      chrome.runtime.sendMessage(
        { action: "improvePrompt", prompt: promptText },
        (response) => {
          if (response.error) {
            alert("Error: " + response.error);
          } else {
            promptTextarea.innerText = response.response;
          }
        }
      );
    } else {
      alert("Please enter a prompt before clicking the button.");
    }
  } else {
    alert("Prompt textarea not found. Please make sure you're on the correct page.");
  }
});
