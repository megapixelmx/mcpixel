const supabaseUrl = 'https://tauciflgtvuuoqqxzucy.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdWNpZmxndHZ1dW9xcXh6dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY1NTUsImV4cCI6MjA5MDY0MjU1NX0.z8eV2KRnq16C5obuyPKhUmeJnGfci9lH-o40QIJuJ5o';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        
        // Foxy dice: "Perfil? No, gracias. Soy FOXY y no tengo perfil. *rimshot* 🎵
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function sanitizeInput(text, maxLength = 500) {
            if (!text || typeof text !== 'string') return '';
            return text.substring(0, maxLength).replace(/[<>]/g, '');
        }

        function validateImageUrl(url) {
            if (!url || typeof url !== 'string') return false;
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'https:') return false;
                const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
                const allowedDomains = ['i.imgur.com', 'imgur.com', 'i.ibb.co', 'ibb.co', 'cdn.discordapp.com', 'media.discordapp.net'];
                const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
                if (!isAllowed) return false;
                return /\.(jpg|jpeg|png|webp|gif)$/i.test(parsed.pathname);
            } catch (e) {
                return false;
            }
        }
        
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggleBtn');
        const navbar = document.getElementById('mainNavbar');
        const loginNav = document.getElementById('loginNav');
        const registerNav = document.getElementById('registerNav');
        const logoutNav = document.getElementById('logoutNav');
        const publishNav = document.getElementById('publishNav');
        const settingsNav = document.getElementById('settingsNav');
        const profileSection = document.getElementById('profileSection');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const sidebarAvatar = document.getElementById('sidebarAvatarIcon');
        const profileTrigger = document.getElementById('toggleBtn');
        const customNotification = document.getElementById('customNotification');
        const addonsContainer = document.getElementById('addonsListContainer');
        const deleteModal = document.getElementById('deleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const profileName = document.getElementById('profileName');
        const profileAvatarCircle = document.getElementById('profileAvatarCircle');
        const verifiedIcon = document.getElementById('verifiedIcon');
        const totalDownloadsSpan = document.getElementById('totalDownloads');
        const totalAddonsSpan = document.getElementById('totalAddons');
        const profileSearchInput = document.getElementById('profileSearchInput');
        const editProfileModal = document.getElementById('editProfileModal');
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        const closeEditModalBtn = document.getElementById('closeEditModalBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const editUsername = document.getElementById('editUsername');
        const editAvatarCircle = document.getElementById('editAvatarCircle');
        const avatarUrlInput = document.getElementById('avatarUrlInput');
        const updateAvatarBtn = document.getElementById('updateAvatarBtn');
        
        let currentUser = null;
        let pendingDeleteAddon = null;
        let allUserAddons = [];
        
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        }
        
        function showNotification(message) {
            const notificationMessage = document.getElementById('notificationMessage');
            notificationMessage.textContent = message;
            customNotification.classList.add('show');
            setTimeout(() => {
                customNotification.classList.remove('show');
            }, 3000);
        }
        
        function getCurrentSession() {
            const session = localStorage.getItem('mc_session');
            if (session) {
                try {
                    return JSON.parse(session);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }
        
        function logout() {
            localStorage.removeItem('mc_session');
            localStorage.removeItem('mc_user');
            window.location.href = '../index.html';
        }
        
        async function getUserAddons(userId) {
            const { data, error } = await supabaseClient
                .from('addons')
                .select('*')
                .eq('author_id', userId)
                .order('publish_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
        
        async function deleteAddon(addonId) {
            const { error } = await supabaseClient
                .from('addons')
                .delete()
                .eq('addon_id', addonId);
            if (error) throw error;
        }
        
function editAddon(encodedAddon) {
            try {
                const addon = JSON.parse(decodeURIComponent(atob(encodedAddon)));
                localStorage.setItem('editingAddon', JSON.stringify(addon));
                window.location.href = 'publish.html';
            } catch (e) {
                showNotification('Error al cargar datos del addon');
            }
        }

        function openDeleteModal(encodedAddon) {
            try {
                pendingDeleteAddon = JSON.parse(decodeURIComponent(atob(encodedAddon)));
                deleteModal.classList.add('active');
            } catch (e) {
                showNotification('Error al cargar datos del addon');
            }
        }
        
        function closeDeleteModal() {
            deleteModal.classList.remove('active');
            pendingDeleteAddon = null;
        }
        
        async function confirmDelete() {
            if (pendingDeleteAddon) {
                await deleteAddon(pendingDeleteAddon.addon_id);
                closeDeleteModal();
                await loadAddons();
                showNotification('Complemento eliminado correctamente');
            }
        }
        
        confirmDeleteBtn.addEventListener('click', confirmDelete);
        
        function formatText(text) {
            if (!text) return '';
            let escaped = escapeHtml(text);
            return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        
        function renderAddons(addons) {
            if (!addonsContainer) return;
            
            if (addons.length === 0) {
                addonsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No has publicado ningún complemento aún.</p>
                        <p style="margin-top: 0.5rem; font-size: 0.85rem;">¡Comienza a compartir tus creaciones!</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div class="addons-grid">';
            addons.forEach(addon => {
                const rawImage = addon.icon_url || addon.banner_url || '';
                const imageUrl = validateImageUrl(rawImage) ? rawImage : '../img/default-addon.png';
                const safeAddonData = btoa(encodeURIComponent(JSON.stringify(addon)));
                const safeTitle = escapeHtml(addon.title || '');
                const safeDesc = formatText(sanitizeInput(addon.description, 100));
                
                html += `
                    <div class="addon-card-owner">
                        <img src="${imageUrl}" alt="${safeTitle}" onerror="this.src='../img/default-addon.png'">
                        <div class="addon-card-owner-info">
                            <h4>${safeTitle}</h4>
                            <p>${safeDesc}</p>
                        </div>
                        <div class="addon-card-owner-actions">
                            <button class="owner-action-btn" data-addon="${safeAddonData}" onclick="editAddon(this.dataset.addon)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                                </svg>
                                Editar
                            </button>
                            <button class="owner-action-btn delete" data-addon="${safeAddonData}" onclick="openDeleteModal(this.dataset.addon)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                Eliminar
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            addonsContainer.innerHTML = html;
        }
        
        function filterAddons(searchTerm) {
            if (!searchTerm.trim()) {
                renderAddons(allUserAddons);
                return;
            }
            const filtered = allUserAddons.filter(addon => 
                addon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                addon.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            renderAddons(filtered);
        }
        
        profileSearchInput.addEventListener('input', (e) => {
            filterAddons(e.target.value);
        });
        
        async function loadAddons() {
            if (!currentUser) return;
            try {
                allUserAddons = await getUserAddons(currentUser.id);
                const totalDownloadsCount = allUserAddons.reduce((sum, addon) => sum + (addon.downloads || 0), 0);
                totalDownloadsSpan.textContent = formatNumber(totalDownloadsCount);
                totalAddonsSpan.textContent = allUserAddons.length;
                renderAddons(allUserAddons);
            } catch (error) {
                console.error('Error loading addons:', error);
                showNotification('Error al cargar tus complementos');
            }
        }
        
        function openEditModal() {
            if (currentUser) {
                editUsername.value = currentUser.public_name || currentUser.username;
                avatarUrlInput.value = currentUser.avatar_url || '';
                if (currentUser.avatar_url) {
                    editAvatarCircle.style.backgroundImage = `url('${currentUser.avatar_url}')`;
                    editAvatarCircle.innerHTML = '';
                } else {
                    editAvatarCircle.style.backgroundImage = 'none';
                    editAvatarCircle.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `;
                }
                editProfileModal.classList.add('active');
            }
        }
        
        function closeEditModal() {
            editProfileModal.classList.remove('active');
        }
        
        async function updateAvatarFromUrl() {
            const url = avatarUrlInput.value.trim();
            if (url && validateImageUrl(url)) {
                const { error } = await supabaseClient
                    .from('users')
                    .update({ avatar_url: url })
                    .eq('id', currentUser.id);
                if (error) {
                    showNotification('Error al actualizar la foto de perfil');
                } else {
                    currentUser.avatar_url = url;
                    updateProfileUI();
                    showNotification('Foto de perfil actualizada correctamente');
                    closeEditModal();
                }
            } else {
                showNotification('URL de imagen no válida. Usa HTTPS con extensiones jpg, png, webp o gif de dominios confiables.');
            }
        }
        
        async function saveProfileChanges() {
            const rawUsername = editUsername.value.trim();
            const newUsername = sanitizeInput(rawUsername, 50);
            if (newUsername && newUsername.length >= 3 && newUsername !== (currentUser.public_name || currentUser.username)) {
                const { error } = await supabaseClient
                    .from('users')
                    .update({ public_name: newUsername })
                    .eq('id', currentUser.id);
                if (error) {
                    showNotification('Error al actualizar el nombre de usuario');
                } else {
                    currentUser.public_name = newUsername;
                    updateProfileUI();
                    showNotification('Nombre de usuario actualizado correctamente');
                    closeEditModal();
                }
            } else {
                closeEditModal();
            }
        }
        
        function updateProfileUI() {
            const displayName = currentUser.public_name || currentUser.username;
            profileName.textContent = displayName;
            userNameDisplay.textContent = displayName;
            
            if (currentUser.avatar_url) {
                profileAvatarCircle.style.backgroundImage = `url('${currentUser.avatar_url}')`;
                profileAvatarCircle.innerHTML = '';
                sidebarAvatar.style.backgroundImage = `url('${currentUser.avatar_url}')`;
                const sidebarHead = sidebarAvatar.querySelector('.u-head');
                const sidebarBody = sidebarAvatar.querySelector('.u-body');
                if (sidebarHead) sidebarHead.style.opacity = '0';
                if (sidebarBody) sidebarBody.style.opacity = '0';
                profileTrigger.style.backgroundImage = `url('${currentUser.avatar_url}')`;
                const triggerHead = profileTrigger.querySelector('.u-head');
                const triggerBody = profileTrigger.querySelector('.u-body');
                if (triggerHead) triggerHead.style.opacity = '0';
                if (triggerBody) triggerBody.style.opacity = '0';
            } else {
                profileAvatarCircle.style.backgroundImage = 'none';
                profileAvatarCircle.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                `;
            }
        }
        
        editAvatarBtn.addEventListener('click', openEditModal);
        closeEditModalBtn.addEventListener('click', closeEditModal);
        saveProfileBtn.addEventListener('click', saveProfileChanges);
        updateAvatarBtn.addEventListener('click', updateAvatarFromUrl);
        
        async function checkAuthState() {
            const session = getCurrentSession();
            if (session && session.user_id) {
                const { data: userData, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', session.user_id)
                    .single();
                if (userData && !error) {
                    currentUser = userData;
                    if (loginNav) loginNav.style.display = 'none';
                    if (registerNav) registerNav.style.display = 'none';
                    if (logoutNav) logoutNav.style.display = 'flex';
                    if (publishNav) publishNav.classList.remove('disabled');
                    if (settingsNav) settingsNav.classList.remove('disabled');
                    
                    updateProfileUI();
                    
                    if (userData.is_verified && verifiedIcon) {
                        verifiedIcon.style.display = 'inline-block';
                    }
                    
                    await loadAddons();
                } else {
                    localStorage.removeItem('mc_session');
                    window.location.href = '../sv/login.html';
                }
            } else {
                window.location.href = '../sv/login.html';
            }
        }
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
        
        if (logoutNav) {
            logoutNav.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        
        if (profileSection) {
            profileSection.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    showNotification('Debes iniciar sesión para ver tu perfil');
                }
            });
        }
        
        window.editAddon = editAddon;
        window.openDeleteModal = openDeleteModal;
        window.closeDeleteModal = closeDeleteModal;
        
        checkAuthState();
