document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const promptNameInput = document.getElementById("promptNameInput");
  const promptInput = document.getElementById("promptInput");
  const addPromptButton = document.getElementById("addPromptButton");
  const promptList = document.getElementById("promptList");
  const searchInput = document.querySelector("[data-search]");
  const folderFilter = document.getElementById("folderFilter");
  const promptFolderSelect = document.getElementById("promptFolderSelect");
  const folderNameInput = document.getElementById("folderNameInput");
  const addFolderButton = document.getElementById("addFolderButton");
  const folderList = document.getElementById("folderList");
  const colorOptions = document.querySelectorAll(".color-option");
  const promptCountDisplay = document.getElementById("promptCount");
  const exportDataBtn = document.getElementById("exportData");
  const importDataBtn = document.getElementById("importData");
  const importFileInput = document.getElementById("importFile");
  const sortSelect = document.getElementById("sortSelect");
  const enableEnhancerToggle = document.getElementById("enableEnhancer");
  const socialSaveButtons = document.querySelectorAll(".save-social-btn");

  // App state
  let selectedColor = "#51A1FF"; // Default color
  let prompts = [];
  let folders = [{ name: "Default", color: "#808080", id: "default" }];
  let nextPromptId = 1;
  let socialLinks = {
    twitter: "",
    linkedin: "",
    github: "",
    youtube: "",
    website: ""
  };

  // =====================
  // Tab Navigation
  // =====================
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${targetTab}-tab`) {
          content.classList.add("active");
        }
      });
    });
  });

  // =====================
  // Drag & Drop Reordering
  // =====================
  function initSortable() {
    // Make prompt list sortable
    const promptSortable = new Sortable(promptList, {
      animation: 150,
      handle: '.prompt-drag-handle',
      ghostClass: 'sortable-ghost',
      onEnd: function(evt) {
        // Update order in the prompts array when items are moved
        const items = Array.from(promptList.querySelectorAll('.promptItem'));
        const reorderedPrompts = [];
        
        items.forEach(item => {
          const promptId = parseInt(item.dataset.id);
          const prompt = prompts.find(p => p.id === promptId);
          if (prompt) {
            reorderedPrompts.push(prompt);
          }
        });
        
        prompts = reorderedPrompts;
        savePrompts();
      }
    });
    
    // Make folder list sortable
    const folderSortable = new Sortable(folderList, {
      animation: 150,
      handle: '.folder-drag-handle',
      ghostClass: 'sortable-ghost',
      filter: '.default-folder', // Default folder can't be moved
      onEnd: function(evt) {
        // Skip if the default folder was attempted to be moved
        if (evt.item.classList.contains('default-folder')) return;
        
        // Update order in the folders array when items are moved
        const items = Array.from(folderList.querySelectorAll('.folder-item'));
        const reorderedFolders = [];
        
        // Always keep default first
        const defaultFolder = folders.find(f => f.id === "default");
        if (defaultFolder) {
          reorderedFolders.push(defaultFolder);
        }
        
        // Add other folders in the new order
        items.forEach(item => {
          if (item.dataset.folder === "default") return;
          
          const folderId = item.dataset.folder;
          const folder = folders.find(f => f.id === folderId);
          if (folder) {
            reorderedFolders.push(folder);
          }
        });
        
        folders = reorderedFolders;
        saveFolders();
      }
    });
  }

  // =====================
  // Enhancement Toggle
  // =====================
  // Load the current setting for the enhancer
  chrome.storage.local.get(['enhancerEnabled'], function(result) {
    // Default to enabled if the setting doesn't exist yet
    const isEnabled = result.enhancerEnabled === undefined ? true : result.enhancerEnabled;
    enableEnhancerToggle.checked = isEnabled;
  });
  
  // Listen for changes to the toggle
  enableEnhancerToggle.addEventListener('change', function() {
    chrome.storage.local.set({ enhancerEnabled: this.checked });
    showNotification(this.checked ? "Enhancement enabled" : "Enhancement disabled");
  });

  // =====================
  // Social Links Management
  // =====================
  // Load social links from storage
  function loadSocialLinks() {
    chrome.storage.local.get(['socialLinks'], function(result) {
      if (result.socialLinks) {
        socialLinks = result.socialLinks;
        
        // Fill in the input fields
        for (const platform in socialLinks) {
          const input = document.getElementById(`${platform}-link`);
          if (input && socialLinks[platform]) {
            input.value = socialLinks[platform];
          }
        }
      }
    });
  }
  
  // Save individual social link
  socialSaveButtons.forEach(button => {
    button.addEventListener('click', function() {
      const platform = this.dataset.platform;
      const input = document.getElementById(`${platform}-link`);
      
      if (input) {
        socialLinks[platform] = input.value.trim();
        chrome.storage.local.set({ socialLinks: socialLinks });
        showNotification(`${platform.charAt(0).toUpperCase() + platform.slice(1)} link saved`, "success");
      }
    });
  });

  // =====================
  // Folder Management
  // =====================
  
  // Color picker functionality
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');
      // Set selected color
      selectedColor = option.dataset.color;
    });
  });

  // Add folder button
  addFolderButton.addEventListener("click", () => {
    const folderName = folderNameInput.value.trim();
    if (!folderName) {
      showNotification("Please enter a folder name", "error");
      return;
    }

    // Check if folder name already exists
    if (folders.some(folder => folder.name.toLowerCase() === folderName.toLowerCase())) {
      showNotification("Folder already exists", "error");
      return;
    }

    const folderId = 'folder_' + Date.now();
    const newFolder = {
      id: folderId,
      name: folderName,
      color: selectedColor,
      order: folders.length // Add order property
    };

    folders.push(newFolder);
    saveFolders();
    createFolderElement(newFolder);
    updateFolderSelects();
    folderNameInput.value = "";
    
    showNotification("Folder added", "success");
  });

  // Create folder element
  function createFolderElement(folder) {
    const folderItem = document.createElement("div");
    folderItem.className = "folder-item";
    if (folder.id === "default") {
      folderItem.classList.add("default-folder");
    }
    folderItem.dataset.folder = folder.id;
    folderItem.style.borderLeftColor = folder.color;

    // Add drag handle for reordering (except for default)
    if (folder.id !== "default") {
      const dragHandle = document.createElement("i");
      dragHandle.className = "fas fa-grip-vertical folder-drag-handle";
      folderItem.appendChild(dragHandle);
    }

    const folderName = document.createElement("span");
    folderName.className = "folder-name";
    folderName.textContent = folder.name;

    const folderCount = document.createElement("span");
    folderCount.className = "folder-count";
    folderCount.textContent = countPromptsInFolder(folder.id);

    // Only add delete button for non-default folders
    if (folder.id !== "default") {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-folder-btn";
      deleteButton.innerHTML = "×";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteFolder(folder.id);
      });
      folderItem.appendChild(deleteButton);
    }

    folderItem.appendChild(folderName);
    folderItem.appendChild(folderCount);
    folderList.appendChild(folderItem);

    // Click on folder to filter prompts
    folderItem.addEventListener("click", () => {
      folderFilter.value = folder.id;
      folderFilter.dispatchEvent(new Event("change"));
      
      // Switch to prompts tab
      document.querySelector('.tab[data-tab="prompts"]').click();
    });
  }

  // Delete folder
  function deleteFolder(folderId) {
    if (confirm("Delete this folder? Prompts will be moved to Default folder.")) {
      // Move prompts to default folder
      prompts = prompts.map(prompt => {
        if (prompt.folderId === folderId) {
          return {...prompt, folderId: "default"};
        }
        return prompt;
      });
      
      // Remove folder
      folders = folders.filter(folder => folder.id !== folderId);
      
      // Update UI and storage
      savePrompts();
      saveFolders();
      refreshUI();
      showNotification("Folder deleted", "success");
    }
  }

  // Count prompts in folder
  function countPromptsInFolder(folderId) {
    return prompts.filter(prompt => prompt.folderId === folderId).length;
  }

  // Update folder selects
  function updateFolderSelects() {
    // Clear options first (except All Folders for filter)
    while (promptFolderSelect.options.length > 0) {
      promptFolderSelect.options.remove(0);
    }
    
    while (folderFilter.options.length > 0) {
      folderFilter.options.remove(0);
    }
    
    // Add All Folders option to filter
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Folders";
    folderFilter.appendChild(allOption);
    
    // Add folder options
    folders.forEach(folder => {
      const option1 = document.createElement("option");
      option1.value = folder.id;
      option1.textContent = folder.name;
      promptFolderSelect.appendChild(option1);
      
      const option2 = document.createElement("option");
      option2.value = folder.id;
      option2.textContent = folder.name;
      folderFilter.appendChild(option2);
    });
  }

  // =====================
  // Prompt Management
  // =====================
  
  // Add prompt button
  addPromptButton.addEventListener("click", function () {
    const promptName = promptNameInput.value.trim();
    const promptText = promptInput.value.trim();
    const folderId = promptFolderSelect.value;

    if (promptName === "" || promptText === "") {
      showNotification("Please enter both a name and prompt text", "error");
      return;
    }

    if (prompts.length >= 50) {
      showNotification("Maximum 50 prompts allowed", "error");
      return;
    }

    const newPrompt = {
      id: nextPromptId++,
      name: promptName,
      text: promptText,
      folderId: folderId,
      createdAt: Date.now(),
      usageCount: 0
    };

    prompts.push(newPrompt);
    savePrompts();
    saveNextId();
    refreshUI();
    
    promptNameInput.value = "";
    promptInput.value = "";
    
    showNotification("Prompt added", "success");
  });

  // Create prompt element
  function createPromptElement(prompt) {
    const folder = folders.find(f => f.id === prompt.folderId) || folders[0];
    
    const promptItem = document.createElement("div");
    promptItem.className = "promptItem";
    promptItem.dataset.id = prompt.id;
    promptItem.dataset.folder = prompt.folderId;
    promptItem.style.borderLeftColor = folder.color;

    // Add drag handle for reordering
    const dragHandle = document.createElement("i");
    dragHandle.className = "fas fa-grip-vertical prompt-drag-handle";
    promptItem.appendChild(dragHandle);

    const promptHeader = document.createElement("div");
    promptHeader.className = "prompt-header";
    
    const promptNameElement = document.createElement("div");
    promptNameElement.textContent = prompt.name;
    promptNameElement.className = "promptName";
    
    const folderBadge = document.createElement("span");
    folderBadge.className = "folder-badge";
    folderBadge.textContent = folder.name;
    folderBadge.style.backgroundColor = folder.color;
    
    promptHeader.appendChild(promptNameElement);
    promptHeader.appendChild(folderBadge);

    const promptTextElement = document.createElement("div");
    promptTextElement.textContent = prompt.text;
    promptTextElement.className = "promptText";

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "prompt-buttons";

    const copyButton = createButton('<i class="fas fa-copy"></i>', "copyButton", () => {
      copyToClipboard(prompt.text);
      // Increment usage count when copied
      prompt.usageCount = (prompt.usageCount || 0) + 1;
      savePrompts();
    });
    
    const editButton = createButton('<i class="fas fa-edit"></i>', "editButton", () => {
      editPrompt(prompt);
    });
    
    const folderButton = createButton('<i class="fas fa-folder"></i>', "folderButton", () => {
      showFolderMenu(prompt, folderButton);
    });
    
    const deleteButton = createButton('<i class="fas fa-trash"></i>', "deleteButton", () => {
      deletePrompt(prompt.id);
    });

    buttonContainer.append(copyButton, editButton, folderButton, deleteButton);
    promptItem.append(promptHeader, promptTextElement, buttonContainer);
    
    // Add to the prompt list
    promptList.appendChild(promptItem);
    
    return promptItem;
  }

  // Create button helper
  function createButton(html, className, clickHandler) {
    const button = document.createElement("button");
    button.innerHTML = html;
    button.className = className;
    if (clickHandler) button.addEventListener("click", clickHandler);
    return button;
  }

  // Edit prompt
  function editPrompt(prompt) {
    const newName = prompt.name;
    const newText = prompt.text;
    
    // Create modal for editing
    const modal = document.createElement("div");
    modal.className = "edit-modal";
    
    const modalContent = document.createElement("div");
    modalContent.className = "edit-modal-content";
    
    const modalHeader = document.createElement("div");
    modalHeader.className = "edit-modal-header";
    modalHeader.textContent = "Edit Prompt";
    
    const closeBtn = document.createElement("span");
    closeBtn.className = "close-modal";
    closeBtn.textContent = "×";
    closeBtn.onclick = () => modal.remove();
    
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = newName;
    nameInput.placeholder = "Prompt name";
    
    const textArea = document.createElement("textarea");
    textArea.value = newText;
    textArea.placeholder = "Prompt text";
    textArea.rows = 5;
    
    // Add folder select in the edit modal
    const folderSelect = document.createElement("select");
    
    // Add folder options
    folders.forEach(folder => {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.name;
      if (folder.id === prompt.folderId) {
        option.selected = true;
      }
      folderSelect.appendChild(option);
    });
    
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Changes";
    saveBtn.onclick = () => {
      if (nameInput.value.trim() === "" || textArea.value.trim() === "") {
        showNotification("Please enter both a name and prompt text", "error");
        return;
      }
      
      // Update prompt
      prompt.name = nameInput.value.trim();
      prompt.text = textArea.value.trim();
      prompt.folderId = folderSelect.value; // Update folder
      
      // Update storage and UI
      savePrompts();
      refreshUI();
      
      // Close modal
      modal.remove();
      showNotification("Prompt updated", "success");
    };
    
    modalHeader.appendChild(closeBtn);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(nameInput);
    modalContent.appendChild(textArea);
    modalContent.appendChild(folderSelect);
    modalContent.appendChild(saveBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
  }

  // Delete prompt
  function deletePrompt(promptId) {
    if (confirm("Delete this prompt?")) {
      prompts = prompts.filter(p => p.id !== promptId);
      savePrompts();
      refreshUI();
      showNotification("Prompt deleted", "success");
    }
  }

  // Show folder menu for moving prompts
  function showFolderMenu(prompt, buttonElement) {
    // Remove any existing menu
    const existingMenu = document.querySelector(".folder-menu");
    if (existingMenu) existingMenu.remove();
    
    // Create menu
    const menu = document.createElement("div");
    menu.className = "folder-menu";
    
    // Header
    const header = document.createElement("div");
    header.textContent = "Move to folder:";
    header.className = "folder-menu-header";
    menu.appendChild(header);
    
    // Folder options
    folders.forEach(folder => {
      const option = document.createElement("div");
      option.className = "folder-menu-item";
      if (folder.id === prompt.folderId) {
        option.classList.add("active");
      }
      
      const colorDot = document.createElement("span");
      colorDot.className = "color-dot";
      colorDot.style.backgroundColor = folder.color;
      
      const name = document.createElement("span");
      name.textContent = folder.name;
      
      option.appendChild(colorDot);
      option.appendChild(name);
      menu.appendChild(option);
      
      option.addEventListener("click", () => {
        // Move prompt to selected folder
        const oldFolderId = prompt.folderId;
        prompt.folderId = folder.id;
        savePrompts();
        
        // Only refresh UI if we're not currently filtering
        // Otherwise, just update this prompt item
        if (folderFilter.value === "all" || folderFilter.value === folder.id) {
          const promptItem = document.querySelector(`.promptItem[data-id="${prompt.id}"]`);
          if (promptItem) {
            // Update folder color and badge
            promptItem.style.borderLeftColor = folder.color;
            promptItem.dataset.folder = folder.id;
            const folderBadge = promptItem.querySelector(".folder-badge");
            if (folderBadge) {
              folderBadge.textContent = folder.name;
              folderBadge.style.backgroundColor = folder.color;
            }
          }
          
          // Update folder counts
          updateFolderCounts();
        } else {
          // If we're filtering and moved to a different folder, refresh completely
          refreshUI();
        }
        
        menu.remove();
        showNotification(`Moved to ${folder.name}`, "success");
      });
    });
    
    // Position and show menu
    const rect = buttonElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    document.addEventListener("click", function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== buttonElement) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    });
  }

  // Clipboard and notification
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Prompt copied", "success");
    });
  }

  function showNotification(message, type = "") {
    const notification = document.createElement("div");
    notification.className = "notification";
    if (type) {
      notification.classList.add(type);
    }
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }, 10);
  }

  // =====================
  // Search, Filter & Sort
  // =====================
  
  // Search functionality
  searchInput.addEventListener("input", filterPrompts);
  folderFilter.addEventListener("change", filterPrompts);
  
  // Sort functionality
  sortSelect.addEventListener("change", () => {
    sortPrompts();
    refreshUI();
  });
  
  function sortPrompts() {
    const sortType = sortSelect.value;
    
    switch (sortType) {
      case "newest":
        prompts.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "oldest":
        prompts.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "name":
        prompts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameDesc":
        prompts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "mostUsed":
        prompts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case "folder":
        prompts.sort((a, b) => {
          const folderA = folders.find(f => f.id === a.folderId);
          const folderB = folders.find(f => f.id === b.folderId);
          const folderNameA = folderA ? folderA.name : "Default";
          const folderNameB = folderB ? folderB.name : "Default";
          return folderNameA.localeCompare(folderNameB);
        });
        break;
    }
  }
  
  function filterPrompts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const folderValue = folderFilter.value;
    const promptItems = promptList.querySelectorAll(".promptItem");
    
    promptItems.forEach(item => {
      const promptName = item.querySelector(".promptName").textContent.toLowerCase();
      const promptText = item.querySelector(".promptText").textContent.toLowerCase();
      const promptFolder = item.dataset.folder;
      
      const matchesSearch = !searchTerm || 
                          promptName.includes(searchTerm) || 
                          promptText.includes(searchTerm);
                          
      const matchesFolder = folderValue === "all" || promptFolder === folderValue;
      
      item.style.display = (matchesSearch && matchesFolder) ? "block" : "none";
    });
  }

  // =====================
  // Data Management
  // =====================
  
  // Save to local storage
  function savePrompts() {
    localStorage.setItem("prompts", JSON.stringify(prompts));
  }
  
  function saveFolders() {
    localStorage.setItem("folders", JSON.stringify(folders));
  }
  
  function saveNextId() {
    localStorage.setItem("nextPromptId", nextPromptId.toString());
  }

  // Load from local storage
  function loadData() {
    // Load prompts
    const savedPrompts = JSON.parse(localStorage.getItem("prompts")) || [];
    // Add usageCount if it doesn't exist
    prompts = savedPrompts.map(p => ({ ...p, usageCount: p.usageCount || 0 }));
    
    // Load folders
    const savedFolders = JSON.parse(localStorage.getItem("folders")) || [];
    // Ensure default folder exists
    if (savedFolders.length === 0 || !savedFolders.some(f => f.id === "default")) {
      savedFolders.unshift({ id: "default", name: "Default", color: "#808080" });
    }
    folders = savedFolders;
    
    // Load next ID
    nextPromptId = parseInt(localStorage.getItem("nextPromptId") || "1");
    
    // Load social links
    loadSocialLinks();
    
    refreshUI();
  }

  // Export data
  exportDataBtn.addEventListener("click", () => {
    // Get social links from storage first
    chrome.storage.local.get(['socialLinks', 'enhancerEnabled'], function(result) {
      const data = {
        prompts,
        folders,
        nextPromptId,
        socialLinks: result.socialLinks || socialLinks,
        enhancerEnabled: result.enhancerEnabled === undefined ? true : result.enhancerEnabled
      };
      
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `promptify_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      showNotification("Data exported", "success");
    });
  });

  // Import data
  importDataBtn.addEventListener("click", () => {
    importFileInput.click();
  });
  
  importFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.prompts && data.folders) {
          if (confirm("This will replace all your current data. Continue?")) {
            prompts = data.prompts;
            folders = data.folders;
            nextPromptId = data.nextPromptId || 1;
            
            // Also import social links and enhancer setting if available
            if (data.socialLinks) {
              socialLinks = data.socialLinks;
              chrome.storage.local.set({ socialLinks: socialLinks });
            }
            
            if (data.enhancerEnabled !== undefined) {
              chrome.storage.local.set({ enhancerEnabled: data.enhancerEnabled });
              enableEnhancerToggle.checked = data.enhancerEnabled;
            }
            
            savePrompts();
            saveFolders();
            saveNextId();
            refreshUI();
            loadSocialLinks();
            
            showNotification("Data imported successfully", "success");
          }
        } else {
          showNotification("Invalid backup file", "error");
        }
      } catch (error) {
        showNotification("Error importing data", "error");
        console.error(error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = null;
  });

  // =====================
  // UI Updates
  // =====================
  
  // Update prompt count display
  function updatePromptCount() {
    promptCountDisplay.textContent = prompts.length;
    
    // Update button state
    if (prompts.length >= 50) {
      addPromptButton.disabled = true;
      addPromptButton.classList.add("disabled");
    } else {
      addPromptButton.disabled = false;
      addPromptButton.classList.remove("disabled");
    }
  }
  
  // Update folder counts
  function updateFolderCounts() {
    folders.forEach(folder => {
      const count = countPromptsInFolder(folder.id);
      const folderElement = document.querySelector(`.folder-item[data-folder="${folder.id}"] .folder-count`);
      if (folderElement) {
        folderElement.textContent = count;
      }
    });
  }

  // Refresh the entire UI
  function refreshUI() {
    // Clear UI
    promptList.innerHTML = "";
    folderList.innerHTML = "";
    
    // Sort prompts based on selected option
    sortPrompts();
    
    // Add default folder always first
    const defaultFolder = folders.find(f => f.id === "default");
    if (defaultFolder) {
      createFolderElement(defaultFolder);
    }
    
    // Add other folders
    folders
      .filter(f => f.id !== "default")
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(folder => createFolderElement(folder));
    
    // Add prompts
    prompts.forEach(prompt => createPromptElement(prompt));
    
    // Update selects
    updateFolderSelects();
    
    // Update counts
    updatePromptCount();
    
    // Apply current filter
    filterPrompts();
    
    // Initialize drag and drop
    initSortable();
  }

  // Initialize the extension
  loadData();
  
  // Initial UI setup
  updatePromptCount();
  // Select first color option
  colorOptions[0].click();
});
