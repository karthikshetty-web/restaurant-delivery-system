/**
 * Kudla Kitchen - Admin Users & Customer Management Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-users-container')) {
        AdminUsers.init();
    }
});

const AdminUsers = {
    state: {
        users: [],
        filteredUsers: [],
        searchQuery: '',
        roleFilter: 'all',
        editingUser: null
    },

    async init() {
        this.bindEvents();
        await this.loadUsers();
    },

    bindEvents() {
        const searchInput = document.getElementById('user-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        const roleSelect = document.getElementById('user-role-filter');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.state.roleFilter = e.target.value;
                this.applyFilters();
            });
        }

        const refreshBtn = document.getElementById('refresh-users-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing users list...', 'info');
                this.loadUsers();
            });
        }
    },

    async loadUsers() {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔄</div>
                    <div style="color: var(--text-muted); font-weight: 600;">Loading user database...</div>
                </td>
            </tr>
        `;

        const res = await AdminAPI.getUsers();
        if (!res.success || !Array.isArray(res.data)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">Failed to load users</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">${AdminApp.escapeHtml(res.message || 'Check connection.')}</div>
                        <button onclick="AdminUsers.loadUsers()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.state.users = res.data;
        this.applyFilters();
    },

    applyFilters() {
        const { users, searchQuery, roleFilter } = this.state;
        let filtered = users.filter(u => {
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.phone || '').toLowerCase();

            const matchesSearch = !searchQuery || name.includes(searchQuery) || email.includes(searchQuery) || phone.includes(searchQuery);
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });

        this.state.filteredUsers = filtered;
        this.renderUsersTable(filtered);
    },

    renderUsersTable(users) {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
                        <div style="font-weight: 700; color: var(--text-primary);">No Users Found</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">No accounts match your search query or role filter.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const currentAdmin = AdminAPI.getUser() || {};

        const rows = users.map(u => {
            const roleBadge = this.getRoleBadge(u.role);
            const dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A';
            const isSelf = currentAdmin.id == u.id;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-light); color: var(--accent-primary); font-weight: 800; display: flex; align-items: center; justify-content: center; text-transform: uppercase;">
                                ${AdminApp.escapeHtml(u.name ? u.name.charAt(0) : 'U')}
                            </div>
                            <div>
                                <strong style="display: block; font-size: 0.95rem;">
                                    ${AdminApp.escapeHtml(u.name)} ${isSelf ? '<span style="font-size: 0.72rem; color: var(--accent-primary); font-weight: 800; text-transform: uppercase;">(You)</span>' : ''}
                                </strong>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${AdminApp.escapeHtml(u.email)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${AdminApp.escapeHtml(u.phone || 'N/A')}</td>
                    <td><span class="order-badge ${roleBadge.class}">${roleBadge.icon} ${roleBadge.label}</span></td>
                    <td><span class="order-badge status-delivered">${AdminApp.escapeHtml((u.status || 'active').toUpperCase())}</span></td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${dateStr}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <button onclick="AdminUsers.openEditModal(${u.id})" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                                ✏️ Edit
                            </button>
                            ${!isSelf ? `
                                <button onclick="AdminUsers.confirmDeleteUser(${u.id}, '${AdminApp.escapeHtml(u.name)}')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #dc2626;">
                                    🗑️ Delete
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    getRoleBadge(role) {
        const map = {
            'admin': { label: 'Administrator', icon: '👑', class: 'status-cancelled' },
            'kitchen': { label: 'Head Chef', icon: '👨‍🍳', class: 'status-preparing' },
            'delivery_partner': { label: 'Delivery Rider', icon: '🚴', class: 'status-delivery' },
            'customer': { label: 'Customer', icon: '👤', class: 'status-confirmed' }
        };
        return map[role] || { label: role, icon: '👤', class: 'status-pending' };
    },

    openEditModal(id) {
        const u = this.state.users.find(user => user.id == id);
        if (!u) return;
        this.state.editingUser = u;
        this.renderUserModal(`Edit User Profile: ${u.name}`);
    },

    renderUserModal(title) {
        let modal = document.getElementById('user-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        const u = this.state.editingUser || {};

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">${AdminApp.escapeHtml(title)}</h3>
                    <button onclick="AdminUsers.closeModal()" class="btn-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="user-form" onsubmit="AdminUsers.handleFormSubmit(event)">
                        <div class="form-group">
                            <label class="detail-label">Full Name *</label>
                            <input type="text" id="user-edit-name" class="form-input" required value="${AdminApp.escapeHtml(u.name || '')}" />
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Email Address (Read-only)</label>
                            <input type="email" class="form-input" disabled value="${AdminApp.escapeHtml(u.email || '')}" style="opacity: 0.7;" />
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Phone Number</label>
                            <input type="text" id="user-edit-phone" class="form-input" value="${AdminApp.escapeHtml(u.phone || '')}" placeholder="9876543210" />
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Reset Password (Optional)</label>
                            <input type="password" id="user-edit-pass" class="form-input" placeholder="Leave empty to keep existing password" />
                        </div>

                        <div class="modal-footer" style="padding-right: 0; padding-left: 0; background: transparent;">
                            <button type="button" onclick="AdminUsers.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('user-edit-name').value.trim();
        const phone = document.getElementById('user-edit-phone').value.trim();
        const password = document.getElementById('user-edit-pass').value.trim();

        if (!name) {
            AdminApp.showToast('User full name is required.', 'error');
            return;
        }

        const data = {
            id: this.state.editingUser.id,
            name,
            phone
        };
        if (password) {
            data.password = password;
        }

        const res = await AdminAPI.updateUser(data);
        if (res.success) {
            AdminApp.showToast('User profile updated successfully!', 'success');
            this.closeModal();
            await this.loadUsers();
        } else {
            AdminApp.showToast(res.message || 'Failed to update user profile', 'error');
        }
    },

    confirmDeleteUser(id, name) {
        if (confirm(`Are you sure you want to delete user account '${name}' (ID #${id})? This action is permanent.`)) {
            this.handleDeleteUser(id);
        }
    },

    async handleDeleteUser(id) {
        const res = await AdminAPI.deleteUser(id);
        if (res.success) {
            AdminApp.showToast('User account deleted successfully!', 'success');
            await this.loadUsers();
        } else {
            AdminApp.showToast(res.message || 'Cannot delete user account.', 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('user-modal');
        if (modal) modal.classList.remove('active');
    }
};
