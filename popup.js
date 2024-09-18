document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetForm = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      forms.forEach((form) => {
        form.style.display =
          form.id === `${targetForm}-form` ? "block" : "none";
      });
    });
  });
});

// Simplified page display function
const pageDisplay = function (userAuth) {
  console.log("pageDisplay called with:", userAuth); // Debug log

  const authSection = document.querySelector(".auth-section");
  const loggedInSection = document.querySelector(".logged-in");

  if (!userAuth || !userAuth.user) {
    console.log("User not authenticated"); // Debug log
    authSection.style.display = "block";
    loggedInSection.style.display = "none";
  } else {
    console.log("User authenticated:", userAuth.user); // Debug log
    authSection.style.display = "none";
    loggedInSection.style.display = "block";
  }
};

// Check user auth status on load
chrome.runtime.sendMessage({ command: "user-auth" }, (response) => {
  pageDisplay(response);
});

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Logout button
  document
    .getElementById("logout-button")
    .addEventListener("click", function () {
      chrome.runtime.sendMessage({ command: "auth-logout" }, () => {
        pageDisplay(false);
      });
    });

  // Login user
  document
    .getElementById("login-button")
    .addEventListener("click", function () {
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;
      chrome.runtime.sendMessage(
        { command: "auth-login", e: email, p: pass },
        (response) => {
          console.log("Login response:", response); // Debug log
          if (response.status === "success") {
            pageDisplay(response);
          } else {
            alert("Login failed. Please try again.");
          }
        }
      );
    });

  // Signup user
  document
    .getElementById("signup-button")
    .addEventListener("click", function () {
      const email = document.getElementById("signup-email").value;
      const pass = document.getElementById("signup-password").value;
      chrome.runtime.sendMessage(
        { command: "auth-signup", e: email, p: pass },
        (response) => {
          console.log("Signup response:", response); // Debug log
          if (response.status === "success") {
            pageDisplay(response);
          } else {
            alert("Signup failed. Please try again.");
          }
        }
      );
    });

  //PROMPTING SECTION AFTER THIS, AUTHENTICATION IS DONE ABOVE

  // Prompt management functionality
  const promptNameInput = document.getElementById("promptNameInput");
  const promptInput = document.getElementById("promptInput");
  const addPromptButton = document.getElementById("addPromptButton");
  const promptList = document.getElementById("promptList");
  const searchInput = document.querySelector("[data-search]");

  let counter = 0;

  // Load pre-made prompts
  const preMadeText = document.getElementsByClassName("premadepromptCopy");
  const copyButtonsNode = document.querySelectorAll(".copyPreMadeButton");
  const titlePrompts = document.querySelectorAll(".titlePrompts");

  const promptTextArray = Array.from(preMadeText).map((el) =>
    el.textContent.replace(/\n/g, "").trim()
  );
  const promptTitleArray = Array.from(titlePrompts).map((el) => el.innerText);

  // Add prompt functionality
  addPromptButton.addEventListener("click", function () {
    const promptName = promptNameInput.value.trim();
    const promptText = promptInput.value.trim();

    if (promptName === "" || promptText === "") {
      alert("Please enter both a name and a prompt text.");
      return;
    }

    addPrompt(promptName, promptText);
    savePrompt(promptName, promptText);
    promptNameInput.value = "";
    promptInput.value = "";
  });

  loadPrompts();

  // Prompt item management functions
  function addPrompt(promptName, promptText) {
    proSavedItems();
    counter++;
    const promptItem = createPromptItem(promptName, promptText);
    promptList.appendChild(promptItem);
  }

  function createPromptItem(promptName, promptText) {
    const promptItem = document.createElement("div");
    promptItem.id = `promptItem${counter}`;
    promptItem.className = "promptItem";

    const promptNameElement = document.createElement("span");
    promptNameElement.textContent = promptName;
    promptNameElement.className = "promptName";

    const promptTextElement = document.createElement("span");
    promptTextElement.textContent = promptText;
    promptTextElement.className = "promptText";

    const copyButton = createButton("🗒️", "copyButton", () =>
      copyToClipboard(promptText)
    );
    const deleteButton = createButton("🗑️", "deleteButton", () => {
      counter--;
      promptItem.remove();
      removePromptFromLocalStorage(promptName);
    });
    const categoriesButton = createButton("📂", "categoriesButton");

    promptItem.append(
      promptNameElement,
      promptTextElement,
      categoriesButton,
      copyButton,
      deleteButton
    );
    return promptItem;
  }

  function createButton(text, className, clickHandler) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    if (clickHandler) button.addEventListener("click", clickHandler);
    return button;
  }

  // Clipboard and notification functions
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Prompt Copied");
    });
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: #f3f3f3; border: 1px solid #ccc; padding: 10px 20px;
      border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); opacity: 0;
      transition: opacity 0.5s ease-in-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "1";
      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    }, 10);
  }

  // Local storage functions
  function savePrompt(promptName, promptText) {
    let prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    prompts.push({ name: promptName, text: promptText });
    localStorage.setItem("prompts", JSON.stringify(prompts));
  }

  function loadPrompts() {
    const savedPrompts = JSON.parse(localStorage.getItem("prompts")) || [];
    savedPrompts.forEach((prompt) => addPrompt(prompt.name, prompt.text));
  }

  function removePromptFromLocalStorage(promptName) {
    let prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    prompts = prompts.filter((prompt) => prompt.name !== promptName);
    localStorage.setItem("prompts", JSON.stringify(prompts));
  }

  // Pro feature limit
  function proSavedItems() {
    const countStoredItems = document.querySelectorAll(".promptItem").length;
    const addPromptButtonClass = document.querySelector(".addPrompt");
    if (countStoredItems > 9) {
      showNotification("Limit Reached");
      addPromptButtonClass.disabled = true;
      addPromptButtonClass.style.backgroundColor = "grey";
      addPromptButtonClass.style.cursor = "not-allowed";
    }
  }

  // Pre-made prompts copy functionality
  copyButtonsNode.forEach((button, index) => {
    button.addEventListener("click", () =>
      copyToClipboard(preMadeText[index].textContent)
    );
  });

  // Search functionality
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();
    const promptItems = promptList.querySelectorAll(".promptItem");

    promptItems.forEach((promptItem) => {
      const promptName = promptItem
        .querySelector(".promptName")
        .textContent.toLowerCase();
      const promptText = promptItem
        .querySelector(".promptText")
        .textContent.toLowerCase();
      promptItem.style.display =
        promptName.includes(searchTerm) || promptText.includes(searchTerm)
          ? "block"
          : "none";
    });
  });

  // Categorize functionality
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("categoriesButton")) {
      const promptItem = event.target.closest(".promptItem");
      const bgBefore = window.getComputedStyle(promptItem).backgroundColor;

      const colorCycle = [
        "rgba(255, 0, 0, 0.4)",
        "rgba(0, 255, 0, 0.4)",
        "rgba(0, 0, 255, 0.4)",
        "rgba(255, 255, 0, 0.4)",
      ];

      let newColor;
      if (
        bgBefore === "rgb(249, 249, 249)" ||
        bgBefore === "rgb(234, 234, 234)"
      ) {
        newColor = colorCycle[0];
      } else {
        const currentIndex = colorCycle.indexOf(bgBefore);
        newColor = colorCycle[(currentIndex + 1) % colorCycle.length];
      }

      updateColor(promptItem, newColor);
    }
  });

  function updateColor(promptItem, newColor) {
    promptItem.style.backgroundColor = newColor;
    localStorage.setItem(promptItem.id, newColor);
  }

  function retrieveColorsFromLocalStorage() {
    document.querySelectorAll(".promptItem").forEach((promptItem) => {
      const storedColor = localStorage.getItem(promptItem.id);
      if (storedColor) {
        promptItem.style.backgroundColor = storedColor;
      }
    });
  }

  retrieveColorsFromLocalStorage();
});
