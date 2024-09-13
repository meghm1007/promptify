// Create the floating button
const floatingButton = document.createElement("button");
floatingButton.id = "floating-button";
floatingButton.innerHTML = "🚀";
document.body.appendChild(floatingButton);

// Add click event listener to the floating button
floatingButton.addEventListener("click", () => {
  const promptTextarea = document.querySelector("#prompt-textarea");
  if (promptTextarea) {
    const promptText = promptTextarea.innerText;
    if (promptText) {
      chrome.runtime.sendMessage({ action: "improvePrompt", prompt: promptText }, (response) => {
        if (response.error) {
          alert("Error: " + response.error);
        } else {
          promptTextarea.innerText = response.response;
        }
      });
    } else {
      alert("Nothing added");
    }
  }
});
