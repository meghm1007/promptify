preMadeText = document.getElementsByClassName("premadepromptCopy");
copyButtonsNode = document.querySelectorAll(".copyPreMadeButton");
titlePrompts = document.querySelectorAll(".titlePrompts");

const promptNameInput = document.getElementById("promptNameInput");
const promptInput = document.getElementById("promptInput");
const addPromptButton = document.getElementById("addPromptButton");
const promptList = document.getElementById("promptList");
const searchInput = document.querySelector("[data-search]");

let counter = 0;

document.addEventListener("DOMContentLoaded", function() {
    promptTextArray = [];
    promptTitleArray = [];
    for (let i = 0; i < preMadeText.length; i++) {
        promptTextArray.push(preMadeText[i].textContent);
        promptTitleArray.push(titlePrompts[i].innerText);
    }
    var cleanedPromptTextArray = promptTextArray.map(function(promptText) {
        return promptText.replace(/\n/g, "")
            .trim();
    });
    console.log(cleanedPromptTextArray); // Array of all the prompts
    console.log(promptTitleArray); // Array of all the titles

    addPromptButton.addEventListener("click", function() {
        const promptName = promptNameInput.value.trim();
        const promptText = promptInput.value.trim();

        if (promptName === "" || promptText === "") {
            alert("Please enter both a name and a prompt text.");
            return;
        }

        addPrompt(promptName, promptText);
        savePrompt(promptName, promptText); // Save prompt to local storage
        promptNameInput.value = "";
        promptInput.value = "";
    });

    loadPrompts(); // Load saved prompts when the page loads
});

function addPrompt(promptName, promptText) {
    proSavedItems();
    counter += 1;
    const promptItem = document.createElement("div");
    const promptItemID = "promptItem" + counter;
    promptItem.id = promptItemID;
    promptItem.className = "promptItem";

    const promptNameElement = document.createElement("span");
    promptNameElement.textContent = promptName;
    promptNameElement.className = "promptName";
    promptItem.appendChild(promptNameElement);

    const promptTextElement = document.createElement("span");
    promptTextElement.textContent = promptText;
    promptTextElement.className = "promptText";
    promptItem.appendChild(promptTextElement);

    const copyButton = document.createElement("button");
    copyButton.textContent = "🗒️";
    copyButton.className = "copyButton";
    copyButton.addEventListener("click", function() {
        copyToClipboard(promptText);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.className = "deleteButton";
    deleteButton.addEventListener("click", function() {
        counter -= 1;
        promptItem.remove();
        removePromptFromLocalStorage(promptName);
    });

    const categoriesButton = document.createElement("button");
    categoriesButton.textContent = "📂";
    categoriesButton.className = "categoriesButton";

    promptItem.appendChild(categoriesButton);
    promptItem.appendChild(copyButton);
    promptItem.appendChild(deleteButton);

    promptList.appendChild(promptItem);
}

function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    // Create notification container
    const notification = document.createElement("div");
    notification.textContent = "Prompt Copied";
    notification.style.position = "fixed";
    notification.style.top = "50%";
    notification.style.left = "50%";
    notification.style.transform = "translate(-50%, -50%)";
    notification.style.backgroundColor = "#f3f3f3";
    notification.style.border = "1px solid #ccc";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "5px";
    notification.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    notification.style.opacity = "0"; // Initially invisible

    // Append notification container to body
    document.body.appendChild(notification);

    // Fade in animation
    notification.style.transition = "opacity 0.5s ease-in-out";
    setTimeout(() => {
        notification.style.opacity = "1";
    }, 10);

    // Automatically remove the notification after 2 seconds
    setTimeout(() => {
        notification.style.opacity = "0"; // Fade out
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500); // Wait for fade out animation to complete
    }, 2000);
}

function proSavedItems() {
    let countStoredItems = document.querySelectorAll(".promptItem")
        .length;
    const addPromptButtonClass = document.querySelectorAll(".addPrompt")[0];
    if (countStoredItems > 9) {
        const notification = document.createElement("div");
        notification.textContent = "Limit Reached";
        notification.style.position = "fixed";
        notification.style.top = "50%";
        notification.style.left = "50%";
        notification.style.transform = "translate(-50%, -50%)";
        notification.style.backgroundColor = "#f3f3f3";
        notification.style.border = "1px solid #ccc";
        notification.style.padding = "10px 20px";
        notification.style.borderRadius = "5px";
        notification.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
        notification.style.opacity = "0"; // Initially invisible

        // Append notification container to body
        document.body.appendChild(notification);

        // Fade in animation
        notification.style.transition = "opacity 0.5s ease-in-out";
        setTimeout(() => {
            notification.style.opacity = "1";
        }, 10);

        // Automatically remove the notification after 2 seconds
        setTimeout(() => {
            notification.style.opacity = "0"; // Fade out
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500); // Wait for fade out animation to complete
        }, 2000);

        addPromptButtonClass.disabled = true;
        addPromptButtonClass.style.backgroundColor = "grey";
        addPromptButtonClass.style.cursor = "not-allowed";
    }
}

function savePrompt(promptName, promptText) {
    // Retrieve existing prompts from local storage
    let prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    // Add the new prompt
    prompts.push({
        name: promptName,
        text: promptText,
    });
    // Store the updated prompts back to local storage
    localStorage.setItem("prompts", JSON.stringify(prompts));
}

function loadPrompts() {
    // Retrieve saved prompts from local storage
    const savedPrompts = JSON.parse(localStorage.getItem("prompts")) || [];
    // Add each saved prompt to the DOM
    savedPrompts.forEach((prompt) => {
        addPrompt(prompt.name, prompt.text);
    });
}

function removePromptFromLocalStorage(promptName) {
    let prompts = JSON.parse(localStorage.getItem("prompts")) || [];
    // Filter out the prompt with the specified name
    prompts = prompts.filter((prompt) => prompt.name !== promptName);
    // Update local storage with the filtered prompts
    localStorage.setItem("prompts", JSON.stringify(prompts));
}

for (let i = 0; i < preMadeText.length; i++) {
    copyButtonsNode[i].addEventListener("click", function() {
        copyToClipboard(preMadeText[i].textContent);
    });
}

function copyPrompt(promptTitle) {
    // Find the prompt with the given title
    const prompt = document.querySelector(
            `.premadeprompt summary:contains('${promptTitle}')`
        )
        .parentNode;

    // Clone the prompt and append it to the prompt list
    const clonedPrompt = prompt.cloneNode(true);
    document.getElementById("promptList")
        .appendChild(clonedPrompt);
}

// Search bar functionality
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("search");
    const promptList = document.getElementById("promptList");

    searchInput.addEventListener("input", function() {
        const searchTerm = searchInput.value.trim()
            .toLowerCase();
        const promptItems = promptList.querySelectorAll(".promptItem");

        promptItems.forEach(function(promptItem) {
            const promptName = promptItem.querySelector(".promptName")
                .textContent.toLowerCase();
            const promptText = promptItem.querySelector(".promptText")
                .textContent.toLowerCase();

            if (promptName.includes(searchTerm) || promptText.includes(searchTerm)) {
                promptItem.style.display = "block";
            } else {
                promptItem.style.display = "none";
            }
        });
    });
});

//Categorize
document.addEventListener("DOMContentLoaded", function() {
    // Function to update the color in both UI and local storage
    function updateColor(promptItem, newColor) {
        // Update UI
        promptItem.style.backgroundColor = newColor;
        // Update local storage for this prompt item
        localStorage.setItem(promptItem.id, newColor);
    }

    // Function to retrieve colors from local storage on page load
    function retrieveColorsFromLocalStorage() {
        // Get all prompt items
        const promptItems = document.querySelectorAll(".promptItem");
        promptItems.forEach((promptItem) => {
            const storedColor = localStorage.getItem(promptItem.id);
            if (storedColor) {
                promptItem.style.backgroundColor = storedColor;
            }
        });
    }

    // Call the function to retrieve colors from local storage on page load
    retrieveColorsFromLocalStorage();

    // Add event listener to the document to listen for clicks on folder buttons
    document.addEventListener("click", function(event) {
        // Check if the clicked element is a folder button
        if (event.target.classList.contains("categoriesButton")) {
            // Get the parent prompt item of the clicked folder button
            const promptItem = event.target.closest(".promptItem");

            // Get the computed background color
            const bgBefore = window.getComputedStyle(promptItem)
                .backgroundColor;

            console.log(bgBefore); // Output the background color

            // Change the background color of the parent prompt item
            let newColor;
            if (
                bgBefore === "rgb(249, 249, 249)" ||
                bgBefore === "rgb(234, 234, 234)"
            ) {
                newColor = "rgba(255, 0, 0, 0.4)";
            } else if (bgBefore === "rgba(255, 0, 0, 0.4)") {
                newColor = "rgba(0, 255, 0, 0.4)";
            } else if (bgBefore === "rgba(0, 255, 0, 0.4)") {
                newColor = "rgba(0, 0, 255, 0.4)";
            } else if (bgBefore === "rgba(0, 0, 255, 0.4)") {
                newColor = "rgba(255, 255, 0, 0.4)";
            } else if (bgBefore === "rgba(255, 255, 0, 0.4)") {
                newColor = "rgba(255, 0, 0, 0.4)";
            }

            // Update the color
            updateColor(promptItem, newColor);
        }
    });
});
