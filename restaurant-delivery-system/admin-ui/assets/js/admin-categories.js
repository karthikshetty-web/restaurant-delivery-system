/**
 * Kudla Kitchen - Admin Category Management Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-categories-container')) {
        AdminCategories.init();
    }
});

const AdminCategories = {
    state: {
        categories: [],
        filteredCategories: [],
        searchQuery: '',
        editingCategory: null
    },

    async init() {
        this.bindEvents();
        await this.loadCategories();
    },

    bindEvents() {
        const searchInput = document.getElementById('category-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        const addBtn = document.getElementById('add-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        const refreshBtn = document.getElementById('refresh-categories-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing categories list...', 'info');
                this.loadCategories();
            });
        }
    },

    async loadCategories() {
        const tableBody = document.getElementById('categories-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔄</div>
                    <div style="color: var(--text-muted); font-weight: 600;">Loading categories from database...</div>
                </td>
            </tr>
        `;

        const res = await AdminAPI.getCategories();
        if (!res.success || !Array.isArray(res.data)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">Failed to load categories</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">${AdminApp.escapeHtml(res.message || 'Check connection.')}</div>
                        <button onclick="AdminCategories.loadCategories()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.state.categories = res.data;
        this.applyFilters();
    },

    applyFilters() {
        const { categories, searchQuery } = this.state;
        let filtered = categories.filter(c => {
            const name = (c.name || '').toLowerCase();
            const desc = (c.description || '').toLowerCase();
            return !searchQuery || name.includes(searchQuery) || desc.includes(searchQuery);
        });

        this.state.filteredCategories = filtered;
        this.renderCategoriesTable(filtered);
    },

    renderCategoriesTable(items) {
        const tableBody = document.getElementById('categories-table-body');
        if (!tableBody) return;

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏷️</div>
                        <div style="font-weight: 700; color: var(--text-primary);">No Categories Found</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">No categories match your search criteria.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = items.map(c => {
            const status = c.status || 'active';
            const badgeClass = status === 'active' ? 'status-delivered' : 'status-cancelled';

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--accent-light); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800;">
                                🏷️
                            </div>
                            <div>
                                <strong style="display: block; font-size: 0.95rem;">${AdminApp.escapeHtml(c.name)}</strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted); max-width: 250px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${AdminApp.escapeHtml(c.description || 'No description provided')}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td><span class="order-badge ${badgeClass}">${AdminApp.escapeHtml(status.toUpperCase())}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <button onclick="AdminCategories.openEditModal(${c.id})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                                ✏️ Edit
                            </button>
                            <button onclick="AdminCategories.confirmDeleteCategory(${c.id})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #dc2626;">
                                🗑️ Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    openAddModal() {
        this.state.editingCategory = null;
        this.renderCategoryModal('Add New Category');
    },

    openEditModal(id) {
        const cat = this.state.categories.find(c => c.id == id);
        if (!cat) return;
        this.state.editingCategory = cat;
        this.renderCategoryModal(`Edit Category: ${cat.name}`);
    },

    renderCategoryModal(title) {
        let modal = document.getElementById('category-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'category-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        const cat = this.state.editingCategory || {};

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">${AdminApp.escapeHtml(title)}</h3>
                    <button onclick="AdminCategories.closeModal()" class="btn-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="category-form" onsubmit="AdminCategories.handleFormSubmit(event)">
                        <div class="form-group">
                            <label class="detail-label">Category Name *</label>
                            <input type="text" id="cat-name" class="form-input" required value="${AdminApp.escapeHtml(cat.name || '')}" placeholder="e.g. Gourmet Pizzas" />
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Description</label>
                            <textarea id="cat-desc" class="form-input" rows="3" placeholder="Category description...">${AdminApp.escapeHtml(cat.description || '')}</textarea>
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Status</label>
                            <select id="cat-status" class="select-input" style="width: 100%; border-radius: var(--radius-sm);">
                                <option value="active" ${cat.status === 'inactive' ? '' : 'selected'}>Active</option>
                                <option value="inactive" ${cat.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>

                        <div class="modal-footer" style="padding-right: 0; padding-left: 0; background: transparent;">
                            <button type="button" onclick="AdminCategories.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">${cat.id ? 'Save Changes' : 'Add Category'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('cat-name').value.trim();
        const description = document.getElementById('cat-desc').value.trim();
        const status = document.getElementById('cat-status').value;

        if (!name) {
            AdminApp.showToast('Category name is required.', 'error');
            return;
        }

        const data = { name, description, status };

        if (this.state.editingCategory) {
            data.id = this.state.editingCategory.id;
            const res = await AdminAPI.updateCategory(data);
            if (res.success) {
                AdminApp.showToast('Category updated successfully!', 'success');
                this.closeModal();
                await this.loadCategories();
            } else {
                AdminApp.showToast(res.message || 'Failed to update category', 'error');
            }
        } else {
            const res = await AdminAPI.addCategory(data);
            if (res.success) {
                AdminApp.showToast('Category added successfully!', 'success');
                this.closeModal();
                await this.loadCategories();
            } else {
                AdminApp.showToast(res.message || 'Failed to add category', 'error');
            }
        }
    },

    confirmDeleteCategory(id) {
        if (confirm(`Are you sure you want to delete Category #${id}? Note: If food items are associated with this category, the database may restrict deletion.`)) {
            this.handleDeleteCategory(id);
        }
    },

    async handleDeleteCategory(id) {
        const res = await AdminAPI.deleteCategory(id);
        if (res.success) {
            AdminApp.showToast('Category deleted successfully!', 'success');
            await this.loadCategories();
        } else {
            AdminApp.showToast(res.message || 'Cannot delete category (used by existing food items or DB restriction)', 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('category-modal');
        if (modal) modal.classList.remove('active');
    }
};
