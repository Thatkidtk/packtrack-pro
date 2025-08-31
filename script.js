class PackTrackPro {
    constructor() {
        this.items = [];
        this.selectedItems = new Set();
        this.currentTab = 'add';
        this.user = null;
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkAuthStatus();
    }

    initializeElements() {
        // Auth elements
        this.authModal = document.getElementById('authModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.loginFormEl = document.getElementById('loginFormEl');
        this.registerFormEl = document.getElementById('registerFormEl');
        this.showRegisterBtn = document.getElementById('showRegister');
        this.showLoginBtn = document.getElementById('showLogin');
        this.mainApp = document.getElementById('mainApp');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userName = document.getElementById('userName');

        // Form elements
        this.itemNameInput = document.getElementById('itemName');
        this.boxNameInput = document.getElementById('boxName');
        this.categorySelect = document.getElementById('category');
        this.descriptionInput = document.getElementById('description');
        this.addItemBtn = document.getElementById('addItemBtn');
        
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchResults = document.getElementById('searchResults');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        
        // Management elements
        this.itemsList = document.getElementById('itemsList');
        this.boxFilter = document.getElementById('boxFilter');
        this.sortBy = document.getElementById('sortBy');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // Bulk add elements
        this.addMultipleBtn = document.getElementById('addMultipleBtn');
        this.bulkAddModal = document.getElementById('bulkAddModal');
        this.bulkBox = document.getElementById('bulkBox');
        this.bulkItems = document.getElementById('bulkItems');
        this.bulkAddConfirm = document.getElementById('bulkAddConfirm');
        
        // Export elements
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.exportCsvBtn = document.getElementById('exportCsvBtn');
        this.printListBtn = document.getElementById('printListBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.mergeImport = document.getElementById('mergeImport');
        
        // Stats elements
        this.totalItems = document.getElementById('totalItems');
        this.totalBoxes = document.getElementById('totalBoxes');
        
        // Navigation elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    bindEvents() {
        // Auth events
        this.loginFormEl.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerFormEl.addEventListener('submit', (e) => this.handleRegister(e));
        this.showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
        this.showLoginBtn.addEventListener('click', () => this.showLoginForm());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Tab navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Form events
        this.addItemBtn.addEventListener('click', () => this.addItem());
        this.itemNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
        this.boxNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // Search events
        this.searchBtn.addEventListener('click', () => this.searchItems());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchItems();
        });
        this.searchInput.addEventListener('input', () => {
            if (!this.searchInput.value) this.clearSearch();
        });
        this.categoryFilter.addEventListener('change', () => this.searchItems());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        // Management events
        this.boxFilter.addEventListener('change', () => this.displayItems());
        this.sortBy.addEventListener('change', () => this.displayItems());
        this.selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
        this.clearAllBtn.addEventListener('click', () => this.clearAllItems());

        // Bulk add events
        this.addMultipleBtn.addEventListener('click', () => this.showBulkAddModal());
        this.bulkAddConfirm.addEventListener('click', () => this.bulkAddItems());
        
        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Export/Import events
        this.exportJsonBtn.addEventListener('click', () => this.exportData('json'));
        this.exportCsvBtn.addEventListener('click', () => this.exportData('csv'));
        this.printListBtn.addEventListener('click', () => this.printList());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importData(e));

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // Authentication methods
    async checkAuthStatus() {
        try {
            const response = await this.apiCall('/api/auth/me');
            if (response.user) {
                this.user = response.user;
                this.showMainApp();
                await this.loadItems();
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            this.showAuthModal();
        }
    }

    showAuthModal() {
        this.authModal.style.display = 'flex';
        this.mainApp.style.display = 'none';
    }

    showMainApp() {
        this.authModal.style.display = 'none';
        this.mainApp.style.display = 'block';
        this.userName.textContent = `Welcome, ${this.user.name}!`;
        this.updateStats();
        this.updateFilters();
        this.displayItems();
    }

    showLoginForm() {
        this.loginForm.classList.add('active');
        this.registerForm.classList.remove('active');
        this.clearAuthErrors();
    }

    showRegisterForm() {
        this.registerForm.classList.add('active');
        this.loginForm.classList.remove('active');
        this.clearAuthErrors();
    }

    async handleLogin(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        this.clearAuthErrors();
        this.setLoading(true, 'Signing in...');

        try {
            const response = await this.apiCall('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            this.user = response.user;
            this.showMainApp();
            await this.loadItems();
            this.showSuccessMessage('Welcome back!');
        } catch (error) {
            this.showAuthError('loginPassword', error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        this.clearAuthErrors();

        // Client-side validation
        if (password !== confirmPassword) {
            this.showAuthError('confirmPassword', 'Passwords do not match');
            return;
        }

        this.setLoading(true, 'Creating account...');

        try {
            const response = await this.apiCall('/api/auth/register', {
                method: 'POST',
                body: { name, email, password }
            });

            this.user = response.user;
            this.showMainApp();
            await this.loadItems();
            this.showSuccessMessage('Account created successfully!');
        } catch (error) {
            console.error('Registration error:', error);
            if (error.message.toLowerCase().includes('email')) {
                this.showAuthError('registerEmail', error.message);
            } else if (error.message.toLowerCase().includes('password')) {
                this.showAuthError('registerPassword', error.message);
            } else if (error.message.toLowerCase().includes('name')) {
                this.showAuthError('registerName', error.message);
            } else {
                this.showAuthError('registerPassword', error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }

    async handleLogout() {
        if (this.isLoading) return;

        this.setLoading(true);
        try {
            await this.apiCall('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.user = null;
            this.items = [];
            this.selectedItems.clear();
            this.showAuthModal();
            this.setLoading(false);
        }
    }

    // API helper methods
    async apiCall(url, options = {}) {
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Check if response is empty or not JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned invalid response');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API call error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to server. Make sure the server is running.');
            }
            if (error.message.includes('Unexpected end of JSON')) {
                throw new Error('Server returned invalid response. Check server logs.');
            }
            throw error;
        }
    }

    async loadItems() {
        try {
            this.items = await this.apiCall('/api/items');
            this.updateStats();
            this.updateFilters();
            this.displayItems();
        } catch (error) {
            console.error('Load items error:', error);
            this.showErrorMessage('Failed to load items');
        }
    }

    // Item management methods
    async addItem() {
        if (this.isLoading) return;

        const itemName = this.itemNameInput.value.trim();
        const boxName = this.boxNameInput.value.trim();
        const category = this.categorySelect.value;
        const description = this.descriptionInput.value.trim();

        this.clearErrors();

        if (!this.validateInput(itemName, 'itemName', 'Item name is required')) return;
        if (!this.validateInput(boxName, 'boxName', 'Box name is required')) return;

        this.setLoading(true);

        try {
            const newItem = await this.apiCall('/api/items', {
                method: 'POST',
                body: {
                    name: itemName,
                    box: boxName,
                    category: category || 'Uncategorized',
                    description: description
                }
            });

            this.items.push(newItem);
            this.updateStats();
            this.updateFilters();
            this.displayItems();
            this.clearForm();
            this.showSuccessMessage(`Added "${itemName}" to ${boxName}`);
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async bulkAddItems() {
        if (this.isLoading) return;

        const boxName = this.bulkBox.value.trim();
        const itemsText = this.bulkItems.value.trim();

        if (!boxName || !itemsText) {
            alert('Please enter both box name and items');
            return;
        }

        const itemNames = itemsText.split('\n').filter(name => name.trim());
        const items = itemNames.map(name => ({
            name: name.trim(),
            box: boxName,
            category: 'Uncategorized',
            description: ''
        }));

        this.setLoading(true);

        try {
            const response = await this.apiCall('/api/items/bulk', {
                method: 'POST',
                body: { items }
            });

            this.items.push(...response.items);
            this.updateStats();
            this.updateFilters();
            this.displayItems();
            this.bulkAddModal.style.display = 'none';
            this.bulkBox.value = '';
            this.bulkItems.value = '';
            this.showSuccessMessage(`Added ${response.created} items to ${boxName}`);
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await this.apiCall(`/api/items/${id}`, { method: 'DELETE' });
                this.items = this.items.filter(item => item.id !== id);
                this.selectedItems.delete(id);
                this.updateStats();
                this.updateFilters();
                this.displayItems();
                this.updateSelectButtons();
            } catch (error) {
                this.showErrorMessage('Failed to delete item');
            }
        }
    }

    async deleteSelected() {
        if (this.selectedItems.size === 0) return;
        
        if (confirm(`Delete ${this.selectedItems.size} selected items?`)) {
            try {
                const ids = Array.from(this.selectedItems);
                await this.apiCall('/api/items/bulk', {
                    method: 'DELETE',
                    body: { ids }
                });

                this.items = this.items.filter(item => !this.selectedItems.has(item.id));
                this.selectedItems.clear();
                this.updateStats();
                this.updateFilters();
                this.displayItems();
                this.updateSelectButtons();
                this.showSuccessMessage('Selected items deleted');
            } catch (error) {
                this.showErrorMessage('Failed to delete items');
            }
        }
    }

    async clearAllItems() {
        if (confirm('Are you sure you want to delete all items? This cannot be undone.')) {
            try {
                const ids = this.items.map(item => item.id);
                if (ids.length > 0) {
                    await this.apiCall('/api/items/bulk', {
                        method: 'DELETE',
                        body: { ids }
                    });
                }

                this.items = [];
                this.selectedItems.clear();
                this.updateStats();
                this.updateFilters();
                this.displayItems();
                this.clearSearch();
                this.updateSelectButtons();
                this.showSuccessMessage('All items cleared');
            } catch (error) {
                this.showErrorMessage('Failed to clear items');
            }
        }
    }

    // UI Methods (keeping most of the original logic)
    switchTab(tabName) {
        this.currentTab = tabName;
        
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        if (tabName === 'search') {
            this.searchInput.focus();
        } else if (tabName === 'manage') {
            this.displayItems();
        }
    }

    searchItems() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        const categoryFilter = this.categoryFilter.value;
        
        if (!searchTerm && !categoryFilter) {
            this.searchResults.innerHTML = '<div class="no-results">Enter a search term or select a category</div>';
            return;
        }

        let matchingItems = this.items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.box.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });

        if (matchingItems.length === 0) {
            this.searchResults.innerHTML = '<div class="no-results">No items found matching your criteria</div>';
            return;
        }

        const resultsHTML = matchingItems.map(item => {
            const highlightedName = this.highlightSearchTerm(item.name, searchTerm);
            return `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${highlightedName}</div>
                        <div class="item-details">
                            <span class="box-name">${item.box}</span>
                            ${item.category !== 'Uncategorized' ? `<span class="category-tag">${item.category}</span>` : ''}
                            ${item.description ? `<span>${item.description}</span>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="delete-btn" onclick="packTracker.deleteItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.searchResults.innerHTML = resultsHTML;
    }

    displayItems() {
        const selectedBox = this.boxFilter.value;
        const sortBy = this.sortBy.value;
        let itemsToShow = [...this.items];

        if (selectedBox) {
            itemsToShow = itemsToShow.filter(item => item.box === selectedBox);
        }

        itemsToShow.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'box':
                    return a.box.localeCompare(b.box) || a.name.localeCompare(b.name);
                case 'category':
                    return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.created_at || b.dateAdded) - new Date(a.created_at || a.dateAdded);
                default:
                    return 0;
            }
        });

        if (itemsToShow.length === 0) {
            this.itemsList.innerHTML = '<div class="no-results">No items to display</div>';
            return;
        }

        const itemsHTML = itemsToShow.map(item => `
            <div class="item">
                <div class="checkbox-item">
                    <input type="checkbox" data-item-id="${item.id}" onchange="packTracker.toggleItemSelection(${item.id})">
                </div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        <span class="box-name">${item.box}</span>
                        ${item.category !== 'Uncategorized' ? `<span class="category-tag">${item.category}</span>` : ''}
                        ${item.description ? `<span>${item.description}</span>` : ''}
                        <small>Added: ${new Date(item.created_at || item.dateAdded).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="packTracker.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.itemsList.innerHTML = itemsHTML;
    }

    exportData(format) {
        if (this.items.length === 0) {
            alert('No items to export');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        
        if (format === 'json') {
            const dataStr = JSON.stringify(this.items, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            this.downloadFile(dataBlob, `packtrack-backup-${timestamp}.json`);
        } else if (format === 'csv') {
            const csvContent = this.convertToCSV(this.items);
            const dataBlob = new Blob([csvContent], {type: 'text/csv'});
            this.downloadFile(dataBlob, `packtrack-inventory-${timestamp}.csv`);
        }
    }

    convertToCSV(items) {
        const headers = ['Item Name', 'Box/Container', 'Category', 'Description', 'Date Added'];
        const csvRows = [headers.join(',')];
        
        items.forEach(item => {
            const row = [
                `"${item.name}"`,
                `"${item.box}"`,
                `"${item.category}"`,
                `"${item.description || ''}"`,
                `"${new Date(item.created_at || item.dateAdded).toLocaleDateString()}"`
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid file format');
                }

                const items = importedData
                    .filter(item => item.name && item.box)
                    .map(item => ({
                        name: item.name,
                        box: item.box,
                        category: item.category || 'Uncategorized',
                        description: item.description || ''
                    }));

                if (items.length === 0) {
                    throw new Error('No valid items found in file');
                }

                if (!this.mergeImport.checked) {
                    await this.clearAllItems();
                }

                this.setLoading(true);
                
                const response = await this.apiCall('/api/items/bulk', {
                    method: 'POST',
                    body: { items }
                });

                await this.loadItems();
                this.showSuccessMessage(`Imported ${response.created} items successfully`);
            } catch (error) {
                this.showErrorMessage('Error importing file: ' + error.message);
            } finally {
                this.setLoading(false);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // Utility methods
    validateInput(value, fieldId, errorMessage) {
        if (!value) {
            const errorElement = document.getElementById(fieldId + 'Error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
            }
            return false;
        }
        return true;
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    clearAuthErrors() {
        document.querySelectorAll('#authModal .error-message').forEach(el => el.textContent = '');
    }

    showAuthError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearForm() {
        this.itemNameInput.value = '';
        this.boxNameInput.value = '';
        this.categorySelect.value = '';
        this.descriptionInput.value = '';
        this.itemNameInput.focus();
    }

    clearSearch() {
        this.searchInput.value = '';
        this.categoryFilter.value = '';
        this.searchResults.innerHTML = '';
    }

    showBulkAddModal() {
        this.bulkAddModal.style.display = 'block';
        this.bulkBox.focus();
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('#itemsList input[type="checkbox"]');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allSelected;
            const itemId = parseInt(cb.dataset.itemId);
            if (!allSelected) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
        });
        
        this.updateSelectButtons();
    }

    toggleItemSelection(itemId) {
        if (this.selectedItems.has(itemId)) {
            this.selectedItems.delete(itemId);
        } else {
            this.selectedItems.add(itemId);
        }
        this.updateSelectButtons();
    }

    updateSelectButtons() {
        this.deleteSelectedBtn.disabled = this.selectedItems.size === 0;
    }

    updateStats() {
        this.totalItems.textContent = this.items.length;
        this.totalBoxes.textContent = new Set(this.items.map(item => item.box)).size;
    }

    updateFilters() {
        this.updateBoxFilter();
        this.updateCategoryFilter();
        this.updateBoxSuggestions();
    }

    updateBoxFilter() {
        const boxes = [...new Set(this.items.map(item => item.box))].sort();
        const currentValue = this.boxFilter.value;
        
        this.boxFilter.innerHTML = '<option value="">All boxes</option>';
        boxes.forEach(box => {
            const option = document.createElement('option');
            option.value = box;
            option.textContent = box;
            this.boxFilter.appendChild(option);
        });
        
        this.boxFilter.value = currentValue;
    }

    updateCategoryFilter() {
        const categories = [...new Set(this.items.map(item => item.category))].sort();
        const currentValue = this.categoryFilter.value;
        
        this.categoryFilter.innerHTML = '<option value="">All categories</option>';
        categories.forEach(category => {
            if (category !== 'Uncategorized') {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                this.categoryFilter.appendChild(option);
            }
        });
        
        this.categoryFilter.value = currentValue;
    }

    updateBoxSuggestions() {
        const boxes = [...new Set(this.items.map(item => item.box))].sort();
        const datalist = document.getElementById('boxSuggestions');
        
        datalist.innerHTML = '';
        boxes.forEach(box => {
            const option = document.createElement('option');
            option.value = box;
            datalist.appendChild(option);
        });
    }

    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    setLoading(loading, message = '') {
        this.isLoading = loading;
        const buttons = document.querySelectorAll('button:not(.close)');
        
        if (loading) {
            buttons.forEach(btn => {
                if (btn.type === 'submit' || btn.classList.contains('btn-primary') || btn.classList.contains('addItemBtn')) {
                    btn.classList.add('loading');
                    if (message) btn.setAttribute('data-loading-text', btn.textContent);
                    btn.disabled = true;
                }
            });
        } else {
            buttons.forEach(btn => {
                btn.classList.remove('loading');
                if (!btn.classList.contains('deleteSelectedBtn') || this.selectedItems.size > 0) {
                    btn.disabled = false;
                }
            });
        }
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        if (type === 'success') {
            toast.style.background = 'var(--success-color)';
            toast.style.color = 'white';
        } else {
            toast.style.background = 'var(--danger-color)';
            toast.style.color = 'white';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }

    printList() {
        window.print();
    }
}

// Initialize the application
const packTracker = new PackTrackPro();