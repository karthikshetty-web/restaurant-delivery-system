/**
 * Kudla Kitchen - Admin Food Management Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-food-container')) {
        AdminFood.init();
    }
});

const AdminFood = {
    state: {
        foodItems: [],
        categories: [],
        filteredFood: [],
        searchQuery: '',
        categoryFilter: 'all',
        availabilityFilter: 'all',
        editingFood: null
    },

    async init() {
        this.bindEvents();
        await Promise.all([
            this.loadCategories(),
            this.loadFoodCatalog()
        ]);
    },

    bindEvents() {
        const searchInput = document.getElementById('food-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        const categorySelect = document.getElementById('food-category-filter');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.state.categoryFilter = e.target.value;
                this.applyFilters();
            });
        }

        const availSelect = document.getElementById('food-availability-filter');
        if (availSelect) {
            availSelect.addEventListener('change', (e) => {
                this.state.availabilityFilter = e.target.value;
                this.applyFilters();
            });
        }

        const addBtn = document.getElementById('add-food-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        const refreshBtn = document.getElementById('refresh-food-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing food catalog...', 'info');
                this.loadFoodCatalog();
            });
        }
    },

    async loadCategories() {
        const res = await AdminAPI.getCategories();
        if (res.success && Array.isArray(res.data)) {
            this.state.categories = res.data;
            this.populateCategoryFilter();
        }
    },

    populateCategoryFilter() {
        const filterSelect = document.getElementById('food-category-filter');
        if (!filterSelect) return;

        let options = `<option value="all">All Categories</option>`;
        this.state.categories.forEach(c => {
            options += `<option value="${c.id}">${AdminApp.escapeHtml(c.name)}</option>`;
        });
        filterSelect.innerHTML = options;
    },

    async loadFoodCatalog() {
        const tableBody = document.getElementById('food-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔄</div>
                    <div style="color: var(--text-muted); font-weight: 600;">Loading food catalog...</div>
                </td>
            </tr>
        `;

        const res = await AdminAPI.getFoodCatalog();
        if (!res.success || !Array.isArray(res.data)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">Failed to load food items</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">${AdminApp.escapeHtml(res.message || 'Check connection.')}</div>
                        <button onclick="AdminFood.loadFoodCatalog()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.state.foodItems = res.data;
        this.applyFilters();
    },

    applyFilters() {
        const { foodItems, searchQuery, categoryFilter, availabilityFilter } = this.state;

        let filtered = foodItems.filter(item => {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const matchesSearch = !searchQuery || name.includes(searchQuery) || desc.includes(searchQuery);

            const matchesCategory = categoryFilter === 'all' || item.category_id == categoryFilter;

            const isAvail = item.is_available == 1;
            const matchesAvail = availabilityFilter === 'all' || 
                (availabilityFilter === 'available' && isAvail) || 
                (availabilityFilter === 'unavailable' && !isAvail);

            return matchesSearch && matchesCategory && matchesAvail;
        });

        this.state.filteredFood = filtered;
        this.renderFoodTable(filtered);
    },

    renderFoodTable(items) {
        const tableBody = document.getElementById('food-table-body');
        if (!tableBody) return;

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🍕</div>
                        <div style="font-weight: 700; color: var(--text-primary);">No Food Items Found</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">No dishes match your filter criteria.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = items.map(item => {
            const isAvail = item.is_available == 1;
            const availBadge = isAvail ? 
                `<span class="order-badge status-delivered">Available ✅</span>` : 
                `<span class="order-badge status-cancelled">Out of Stock ❌</span>`;

            const imgPlaceholder = item.image ? 
                `<img src="${AdminApp.escapeHtml(item.image)}" alt="${AdminApp.escapeHtml(item.name)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: var(--bg-surface);" onError="this.onerror=null;this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';" />` :
                `<div style="width: 44px; height: 44px; border-radius: 8px; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🍕</div>`;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            ${imgPlaceholder}
                            <div>
                                <strong style="display: block; font-size: 0.95rem;">${AdminApp.escapeHtml(item.name)}</strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); max-width: 220px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${AdminApp.escapeHtml(item.description || 'No description')}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td><span class="order-badge status-confirmed">${AdminApp.escapeHtml(item.category_name || 'General')}</span></td>
                    <td><strong>₹${parseFloat(item.price).toFixed(2)}</strong></td>
                    <td>${item.preparation_time || 20} mins</td>
                    <td>${availBadge}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <button onclick="AdminFood.toggleAvailability(${item.id}, ${isAvail ? 0 : 1})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Toggle Availability">
                                ${isAvail ? '⏸️ Mark Unavailable' : '▶️ Mark Available'}
                            </button>
                            <button onclick="AdminFood.openEditModal(${item.id})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Edit Food">
                                ✏️ Edit
                            </button>
                            <button onclick="AdminFood.confirmDeleteFood(${item.id})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #dc2626;" title="Delete Food">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    async toggleAvailability(id, newStatus) {
        const res = await AdminAPI.updateFood({ id, is_available: newStatus });
        if (res.success) {
            AdminApp.showToast(`Food availability updated successfully!`, 'success');
            await this.loadFoodCatalog();
        } else {
            AdminApp.showToast(res.message || 'Failed to update availability', 'error');
        }
    },

    openAddModal() {
        this.state.editingFood = null;
        this.renderFoodModal('Add New Food Item');
    },

    openEditModal(id) {
        const item = this.state.foodItems.find(f => f.id == id);
        if (!item) return;
        this.state.editingFood = item;
        this.renderFoodModal(`Edit Food: ${item.name}`);
    },

    renderFoodModal(title) {
        let modal = document.getElementById('food-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'food-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        const item = this.state.editingFood || {};
        const categories = this.state.categories;

        let categoryOptions = categories.map(c => `
            <option value="${c.id}" ${item.category_id == c.id ? 'selected' : ''}>${AdminApp.escapeHtml(c.name)}</option>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">${AdminApp.escapeHtml(title)}</h3>
                    <button onclick="AdminFood.closeModal()" class="btn-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="food-form" onsubmit="AdminFood.handleFormSubmit(event)">
                        <div class="form-group">
                            <label class="detail-label">Food Item Name *</label>
                            <input type="text" id="food-name" class="form-input" required value="${AdminApp.escapeHtml(item.name || '')}" placeholder="e.g. Paneer Butter Masala" />
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="detail-label">Category *</label>
                                <select id="food-category" class="select-input" style="width: 100%; border-radius: var(--radius-sm);" required>
                                    ${categoryOptions}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="detail-label">Price (₹) *</label>
                                <input type="number" step="0.01" id="food-price" class="form-input" required value="${item.price || ''}" placeholder="14.99" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Description</label>
                            <textarea id="food-desc" class="form-input" rows="3" placeholder="Brief ingredient or taste description...">${AdminApp.escapeHtml(item.description || '')}</textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="detail-label">Image URL</label>
                                <input type="text" id="food-image" class="form-input" value="${AdminApp.escapeHtml(item.image || '')}" placeholder="https://..." />
                            </div>

                            <div class="form-group">
                                <label class="detail-label">Prep Time (mins)</label>
                                <input type="number" id="food-prep" class="form-input" value="${item.preparation_time || 20}" placeholder="20" />
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
                                <input type="checkbox" id="food-avail" ${item.is_available == 0 ? '' : 'checked'} style="width: 18px; height: 18px;" />
                                <span style="font-weight: 600; font-size: 0.9rem;">Available for Ordering</span>
                            </label>
                        </div>

                        <div class="modal-footer" style="padding-right: 0; padding-left: 0; background: transparent;">
                            <button type="button" onclick="AdminFood.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">${item.id ? 'Save Changes' : 'Add Food Item'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('food-name').value.trim();
        const category_id = document.getElementById('food-category').value;
        const price = parseFloat(document.getElementById('food-price').value);
        const description = document.getElementById('food-desc').value.trim();
        const image = document.getElementById('food-image').value.trim();
        const preparation_time = parseInt(document.getElementById('food-prep').value, 10) || 20;
        const is_available = document.getElementById('food-avail').checked ? 1 : 0;

        if (!name || !category_id || isNaN(price)) {
            AdminApp.showToast('Please fill in required fields.', 'error');
            return;
        }

        const data = {
            category_id,
            name,
            description,
            price,
            image,
            preparation_time,
            is_available
        };

        if (this.state.editingFood) {
            data.id = this.state.editingFood.id;
            const res = await AdminAPI.updateFood(data);
            if (res.success) {
                AdminApp.showToast('Food item updated successfully!', 'success');
                this.closeModal();
                await this.loadFoodCatalog();
            } else {
                AdminApp.showToast(res.message || 'Failed to update food item', 'error');
            }
        } else {
            const res = await AdminAPI.addFood(data);
            if (res.success) {
                AdminApp.showToast('Food item added successfully!', 'success');
                this.closeModal();
                await this.loadFoodCatalog();
            } else {
                AdminApp.showToast(res.message || 'Failed to add food item', 'error');
            }
        }
    },

    confirmDeleteFood(id) {
        if (confirm(`Are you sure you want to delete food item #${id}?`)) {
            this.handleDeleteFood(id);
        }
    },

    async handleDeleteFood(id) {
        const res = await AdminAPI.deleteFood(id);
        if (res.success) {
            AdminApp.showToast('Food item deleted successfully!', 'success');
            await this.loadFoodCatalog();
        } else {
            AdminApp.showToast(res.message || 'Could not delete food item', 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('food-modal');
        if (modal) modal.classList.remove('active');
    }
};
