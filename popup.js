document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const promptNameInput = document.getElementById("promptNameInput");
  const promptInput = document.getElementById("promptInput");
  const addPromptButton = document.getElementById("addPromptButton");
  const promptList = document.getElementById("promptList");
  const folderNameInput = document.getElementById("folderNameInput");
  const addFolderButton = document.getElementById("addFolderButton");
  const folderList = document.getElementById("folderList");
  const colorOptions = document.querySelectorAll(".color-option");
  const promptCountDisplay = document.getElementById("promptCount");
  const exportDataBtn = document.getElementById("exportData");
  const importDataBtn = document.getElementById("importData");
  const importFileInput = document.getElementById("importFile");
  const enableEnhancerToggle = document.getElementById("enableEnhancer");
  const socialSaveButtons = document.querySelectorAll(".save-social-btn");

  // App state
  let selectedColor = "#51A1FF"; // Default color
  let prompts = [];
  let folders = [{ name: "Default", color: "#808080", id: "default" }];
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
    showNotification(this.checked ? "Enhancement enabled" : "Enhancement disabled", "success");
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
  
  // Add copy buttons for social links
  function addCopyButtonsToSocialLinks() {
    document.querySelectorAll('.social-link-item').forEach(item => {
      const platform = item.querySelector('.save-social-btn').dataset.platform;
      const input = item.querySelector('.social-link-input');
      
      // Check if copy button already exists
      if (!item.querySelector('.copy-social-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-social-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = `Copy ${platform} link`;
        
        copyBtn.addEventListener('click', () => {
          if (input.value.trim()) {
            navigator.clipboard.writeText(input.value.trim());
            showNotification(`${platform.charAt(0).toUpperCase() + platform.slice(1)} link copied`, "success");
          } else {
            showNotification(`No ${platform} link to copy`, "error");
          }
        });
        
        // Insert before save button
        item.insertBefore(copyBtn, item.querySelector('.save-social-btn'));
      }
    });
  }

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
      color: selectedColor
    };

    folders.push(newFolder);
    saveFolders();
    createFolderElement(newFolder);
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

    // Click on folder to filter prompts by that folder
    folderItem.addEventListener("click", () => {
      displayPromptsByFolder(folder.id);
      
      // Switch to prompts tab
      document.querySelector('.tab[data-tab="prompts"]').click();
    });
  }

  // Delete folder
  function deleteFolder(folderId) {
    // Can't delete default folder
    if (folderId === "default") {
      showNotification("Cannot delete the Default folder", "error");
      return;
    }
    
    // Check if folder contains prompts
    const hasPrompts = prompts.some(prompt => prompt.folderId === folderId);
    
    if (hasPrompts) {
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
    } else {
      // If no prompts, just delete it without asking
      folders = folders.filter(folder => folder.id !== folderId);
      saveFolders();
      refreshUI();
      showNotification("Folder deleted", "success");
    }
  }

  // Count prompts in folder
  function countPromptsInFolder(folderId) {
    return prompts.filter(prompt => prompt.folderId === folderId).length;
  }

  // Display prompts filtered by folder
  function displayPromptsByFolder(folderId) {
    promptList.innerHTML = "";
    
    // Get prompts in the folder
    const folderPrompts = prompts.filter(prompt => 
      folderId === "all" || prompt.folderId === folderId
    );
    
    // Sort by newest first
    const sortedPrompts = [...folderPrompts].sort((a, b) => b.createdAt - a.createdAt);
    
    // Render prompts
    sortedPrompts.forEach(prompt => createPromptElement(prompt));
  }

  // =====================
  // Prompt Management
  // =====================
  
  // Add prompt button
  addPromptButton.addEventListener("click", addPrompt);
  
  // Add prompt function
  function addPrompt() {
    const name = promptNameInput.value.trim();
    const text = promptInput.value.trim();
    // Always use default folder
    const folderId = "default";
    
    if (!name || !text) {
      showNotification("Please enter a name and text for your prompt", "error");
      return;
    }
    
    const maxPrompts = 50;
    if (prompts.length >= maxPrompts) {
      showNotification(`You've reached the maximum of ${maxPrompts} prompts`, "error");
      return;
    }
    
    const promptId = Date.now().toString();
    const newPrompt = {
      id: promptId,
      name: name,
      text: text,
      folderId: folderId,
      createdAt: Date.now(),
      usageCount: 0
    };
    
    prompts.push(newPrompt);
    savePrompts();
    
    // Clear inputs
    promptNameInput.value = "";
    promptInput.value = "";
    
    // Update UI
    createPromptElement(newPrompt);
    updatePromptCount();
    refreshFolderCounts();
    
    showNotification("Prompt added successfully", "success");
  }
  
  // Create prompt element
  function createPromptElement(prompt) {
    const folder = folders.find(f => f.id === prompt.folderId) || folders[0];
    
    const promptElement = document.createElement("div");
    promptElement.className = "promptItem";
    promptElement.dataset.id = prompt.id;
    promptElement.style.borderLeftColor = folder.color;
    
    const promptHeader = document.createElement("div");
    promptHeader.className = "prompt-header";
    
    const promptName = document.createElement("span");
    promptName.className = "promptName";
    promptName.textContent = prompt.name;
    
    const folderBadge = document.createElement("span");
    folderBadge.className = "folder-badge";
    folderBadge.style.backgroundColor = folder.color;
    folderBadge.textContent = folder.name;
    
    promptHeader.appendChild(promptName);
    promptHeader.appendChild(folderBadge);
    
    const promptText = document.createElement("div");
    promptText.className = "promptText";
    promptText.textContent = prompt.text;
    
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "prompt-buttons";
    
    // Copy button
    const copyButton = document.createElement("button");
    copyButton.className = "copyButton";
    copyButton.title = "Copy Prompt";
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.addEventListener("click", () => copyPrompt(prompt));
    
    // Edit button
    const editButton = document.createElement("button");
    editButton.className = "editButton";
    editButton.title = "Edit Prompt";
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.addEventListener("click", () => editPrompt(prompt));
    
    // Change folder button
    const folderButton = document.createElement("button");
    folderButton.className = "folderButton";
    folderButton.title = "Change Folder";
    folderButton.innerHTML = '<i class="fas fa-folder"></i>';
    folderButton.addEventListener("click", (e) => showFolderMenu(e, prompt));
    
    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "deleteButton";
    deleteButton.title = "Delete Prompt";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener("click", () => deletePrompt(prompt.id));
    
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(folderButton);
    buttonContainer.appendChild(deleteButton);
    
    promptElement.appendChild(promptHeader);
    promptElement.appendChild(promptText);
    promptElement.appendChild(buttonContainer);
    
    // Add to list or replace existing
    const existingPrompt = document.querySelector(`.promptItem[data-id="${prompt.id}"]`);
    if (existingPrompt) {
      existingPrompt.replaceWith(promptElement);
    } else {
      promptList.prepend(promptElement);
    }
    
    return promptElement;
  }
  
  // Show folder menu for changing prompt folder
  function showFolderMenu(event, prompt) {
    event.stopPropagation();
    
    // Remove any existing menus
    const existingMenu = document.querySelector('.folder-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'folder-menu';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'folder-menu-header';
    header.textContent = 'Move to folder:';
    menu.appendChild(header);
    
    // Add folder options
    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = 'folder-menu-item';
      if (prompt.folderId === folder.id) {
        item.classList.add('active');
      }
      
      const colorDot = document.createElement('span');
      colorDot.className = 'color-dot';
      colorDot.style.backgroundColor = folder.color;
      
      const folderName = document.createElement('span');
      folderName.textContent = folder.name;
      
      item.appendChild(colorDot);
      item.appendChild(folderName);
      
      item.addEventListener('click', () => {
        changePromptFolder(prompt.id, folder.id);
        menu.remove();
      });
      
      menu.appendChild(item);
    });
    
    // Position menu - fix positioning to prevent going offscreen
    const buttonRect = event.target.closest('button').getBoundingClientRect();
    const container = document.querySelector('.container');
    const containerRect = container.getBoundingClientRect();
    
    // Add to body to get proper positioning
    document.body.appendChild(menu);
    
    // Calculate position to keep menu visible
    const menuRect = menu.getBoundingClientRect();
    let left = buttonRect.left;
    
    // Ensure menu doesn't go outside right edge
    if (left + menuRect.width > containerRect.right) {
      left = containerRect.right - menuRect.width - 10;
    }
    
    // Ensure menu doesn't go outside bottom edge
    let top = buttonRect.bottom + 5;
    if (top + menuRect.height > window.innerHeight) {
      top = buttonRect.top - menuRect.height - 5;
    }
    
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    
    // Close when clicking outside
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== event.target) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }
  
  // Change prompt folder
  function changePromptFolder(promptId, folderId) {
    const promptIndex = prompts.findIndex(p => p.id === promptId);
    if (promptIndex !== -1) {
      prompts[promptIndex].folderId = folderId;
      savePrompts();
      refreshUI();
      
      const folder = folders.find(f => f.id === folderId);
      showNotification(`Moved to "${folder.name}" folder`, "success");
    }
  }
  
  // Copy prompt
  function copyPrompt(prompt) {
    navigator.clipboard.writeText(prompt.text).then(() => {
      // Update usage count
      const index = prompts.findIndex(p => p.id === prompt.id);
      if (index !== -1) {
        prompts[index].usageCount++;
        savePrompts();
      }
      
      showNotification("Prompt copied to clipboard", "success");
      
      // Check if enhancer is enabled and send message
      chrome.storage.local.get(['enhancerEnabled'], function(result) {
        if (result.enhancerEnabled) {
          chrome.runtime.sendMessage({
            action: "enhancePrompt",
            prompt: prompt.text
          });
        }
      });
    }).catch(err => {
      console.error("Failed to copy: ", err);
      showNotification("Failed to copy prompt", "error");
    });
  }
  
  // Edit prompt
  function editPrompt(prompt) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    
    modal.innerHTML = `
      <div class="edit-modal-content">
        <div class="edit-modal-header">
          <span>Edit Prompt</span>
          <span class="close-modal">&times;</span>
        </div>
        <input type="text" id="editNameInput" placeholder="Prompt Name" value="${escapeHTML(prompt.name)}">
        <textarea id="editTextInput" placeholder="Prompt Text" rows="5">${escapeHTML(prompt.text)}</textarea>
        <button id="saveEditButton">Save Changes</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
    });
    
    // Handle click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Handle save button
    modal.querySelector('#saveEditButton').addEventListener('click', () => {
      const newName = document.getElementById('editNameInput').value.trim();
      const newText = document.getElementById('editTextInput').value.trim();
      
      if (!newName || !newText) {
        showNotification("Name and text are required", "error");
        return;
      }
      
      // Update prompt
      const index = prompts.findIndex(p => p.id === prompt.id);
      if (index !== -1) {
        prompts[index] = {
          ...prompts[index],
          name: newName,
          text: newText
        };
        
        savePrompts();
        
        // Update UI without full refresh
        const promptElement = document.querySelector(`.promptItem[data-id="${prompt.id}"]`);
        if (promptElement) {
          // Update name and text in the UI
          promptElement.querySelector('.promptName').textContent = newName;
          promptElement.querySelector('.promptText').textContent = newText;
        }
        
        modal.remove();
        showNotification("Prompt updated successfully", "success");
      }
    });
  }
  
  // Delete prompt
  function deletePrompt(promptId) {
    const promptElement = document.querySelector(`.promptItem[data-id="${promptId}"]`);
    if (!promptElement) return;
    
    if (confirm("Are you sure you want to delete this prompt?")) {
      // Remove from array
      prompts = prompts.filter(p => p.id !== promptId);
      
      // Save to storage
      savePrompts();
      
      // Remove from UI
      promptElement.remove();
      
      // Update counts
      updatePromptCount();
      refreshFolderCounts();
      
      showNotification("Prompt deleted", "success");
    }
  }
  
  // =====================
  // Import/Export
  // =====================
  
  // Export data
  exportDataBtn.addEventListener("click", () => {
    const data = {
      prompts: prompts,
      folders: folders,
      socialLinks: socialLinks
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `promptify_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification("Data exported successfully", "success");
  });
  
  // Import button
  importDataBtn.addEventListener("click", () => {
    importFileInput.click();
  });
  
  // Import data
  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (importedData.prompts && Array.isArray(importedData.prompts)) {
          prompts = importedData.prompts;
        }
        
        if (importedData.folders && Array.isArray(importedData.folders)) {
          // Ensure default folder exists
          if (!importedData.folders.some(f => f.id === "default")) {
            importedData.folders.unshift({ id: "default", name: "Default", color: "#808080" });
          }
          folders = importedData.folders;
        }
        
        if (importedData.socialLinks) {
          socialLinks = importedData.socialLinks;
          loadSocialLinks();
        }
        
        savePrompts();
        saveFolders();
        refreshUI();
        showNotification("Data imported successfully", "success");
      } catch (error) {
        console.error("Import error:", error);
        showNotification("Failed to import data", "error");
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  });
  
  // =====================
  // Helpers
  // =====================
  
  // Update prompt count
  function updatePromptCount() {
    const count = prompts.length;
    const maxPrompts = 50;
    promptCountDisplay.textContent = count;
    
    // Disable add button if limit reached
    if (count >= maxPrompts) {
      addPromptButton.classList.add("disabled");
      addPromptButton.disabled = true;
    } else {
      addPromptButton.classList.remove("disabled");
      addPromptButton.disabled = false;
    }
  }
  
  // Refresh the UI
  function refreshUI() {
    // Clear existing elements
    promptList.innerHTML = "";
    folderList.innerHTML = "";
    
    // Rebuild UI elements
    folders.forEach(folder => createFolderElement(folder));
    
    // Show all prompts sorted by newest
    const sortedPrompts = [...prompts].sort((a, b) => b.createdAt - a.createdAt);
    sortedPrompts.forEach(prompt => createPromptElement(prompt));
    
    updatePromptCount();
    refreshFolderCounts();
  }
  
  // Update folder counts
  function refreshFolderCounts() {
    document.querySelectorAll('.folder-item').forEach(item => {
      const folderId = item.dataset.folder;
      const count = countPromptsInFolder(folderId);
      item.querySelector('.folder-count').textContent = count;
    });
  }
  
  // Show notification
  function showNotification(message, type = "info") {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 2000);
  }
  
  // Save prompts to storage
  function savePrompts() {
    chrome.storage.local.set({ prompts: prompts });
  }
  
  // Save folders to storage
  function saveFolders() {
    chrome.storage.local.set({ folders: folders });
  }
  
  // Escape HTML to prevent XSS
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // =====================
  // Initialize
  // =====================
  
  // Load data from storage
  function loadData() {
    chrome.storage.local.get(['prompts', 'folders', 'socialLinks'], function(result) {
      // Load prompts
      if (result.prompts && Array.isArray(result.prompts)) {
        prompts = result.prompts;
      }
      
      // Load folders
      if (result.folders && Array.isArray(result.folders)) {
        folders = result.folders;
      } else {
        // Initialize with default folder
        saveFolders();
      }
      
      // Load social links
      if (result.socialLinks) {
        socialLinks = result.socialLinks;
      }
      
      // Initialize UI
      refreshUI();
      loadSocialLinks();
      addCopyButtonsToSocialLinks();
      
      // Set initial selected color
      if (colorOptions.length > 0) {
        colorOptions[0].click();
      }
    });
  }
  
  // Initialize app
  loadData();
});
