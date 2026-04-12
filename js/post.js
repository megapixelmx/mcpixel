const supabaseUrl = 'https://tauciflgtvuuoqqxzucy.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdWNpZmxndHZ1dW9xcXh6dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY1NTUsImV4cCI6MjA5MDY0MjU1NX0.z8eV2KRnq16C5obuyPKhUmeJnGfci9lH-o40QIJuJ5o';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        
        // Foxy dice: "Hey! Encontraste un Easter Egg! Toma un galletico 🍪"
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function sanitizeInput(text, maxLength = 1000) {
            if (!text || typeof text !== 'string') return '';
            return text.substring(0, maxLength).replace(/[<>]/g, '');
        }

        function validateDownloadLink(url) {
            if (!url || typeof url !== 'string') return false;
            try {
                const parsed = new URL(url);
                const allowedProtocols = ['https:'];
                if (!allowedProtocols.includes(parsed.protocol)) return false;
                return true;
            } catch (e) {
                return false;
            }
        }

        function generateAddonId() {
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2, 15);
            const randomPart2 = Math.random().toString(36).substring(2, 15);
            return `addon_${timestamp}_${randomPart}${randomPart2}`;
        }

        function validateTags(tags) {
            if (!tags || typeof tags !== 'string') return '';
            const allowedChars = /^[a-zA-Z0-9\s,_-]+$/;
            const parts = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0 && t.length <= 20);
            return parts.slice(0, 10).join(', ');
        }
        
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggleBtn');
        const navbar = document.getElementById('mainNavbar');
        const sidebarAvatar = document.getElementById('sidebarAvatarIcon');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const logoutNav = document.getElementById('logoutNav');
        const loginNav = document.getElementById('loginNav');
        const urlModal = document.getElementById('urlModal');
        const modalInput = document.getElementById('modalInput');
        const saveModal = document.getElementById('saveModal');
        const closeModal = document.getElementById('closeModal');
        const notificationContainer = document.getElementById('notificationContainer');
        const addonTitleInput = document.getElementById('addonTitle');
        const duplicateMessage = document.getElementById('duplicateMessage');
        const submitBtn = document.getElementById('submitBtn');
        let currentUser = null;
        let activeTarget = null;
        let iconUrl = null;
        let bannerUrl = null;
        let allAddons = [];
        
        async function loadAllAddons() {
            const { data, error } = await supabaseClient
                .from('addons')
                .select('title')
                .eq('status', 'approved');
            if (!error && data) {
                allAddons = data;
            }
        }
        
        function normalizeString(str) {
            return str.toLowerCase().trim().replace(/\s+/g, ' ');
        }
        
        function checkDuplicateTitle() {
            const currentTitle = addonTitleInput.value.trim();
            if (!currentTitle) {
                duplicateMessage.style.display = 'none';
                addonTitleInput.classList.remove('duplicate');
                submitBtn.disabled = false;
                return;
            }
            const normalizedCurrent = normalizeString(currentTitle);
            const exists = allAddons.some(addon => normalizeString(addon.title) === normalizedCurrent);
            if (exists) {
                duplicateMessage.style.display = 'flex';
                addonTitleInput.classList.add('duplicate');
                submitBtn.disabled = true;
            } else {
                duplicateMessage.style.display = 'none';
                addonTitleInput.classList.remove('duplicate');
                submitBtn.disabled = false;
            }
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showNotification(message, type = 'error') {
            const id = Date.now();
            const safeMessage = escapeHtml(message);
            const safeType = ['success', 'warning', 'error'].includes(type) ? type : 'error';
            let icon = '';
            if (safeType === 'success') {
                icon = '<svg class="notification-icon" fill="none" stroke="#34c759" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>';
            } else if (safeType === 'warning') {
                icon = '<svg class="notification-icon" fill="none" stroke="#ff9f0a" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
            } else {
                icon = '<svg class="notification-icon" fill="none" stroke="#ff3b30" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
            }
            const html = `
                <div class="notification ${safeType}" id="notif-${id}">
                    ${icon}
                    <div class="notification-content">${safeMessage}</div>
                </div>
            `;
            notificationContainer.insertAdjacentHTML('beforeend', html);
            const element = document.getElementById(`notif-${id}`);
            setTimeout(() => element && element.classList.add('active'), 10);
            setTimeout(() => {
                if (element) {
                    element.classList.remove('active');
                    setTimeout(() => element && element.remove(), 400);
                }
            }, 4000);
        }
        
        const descriptionField = document.getElementById('addonDescription');
        const charCounter = document.getElementById('charCounter');
        
        function updateCharCounter() {
            const length = descriptionField.value.length;
            charCounter.textContent = `${length} / 200 caracteres mínimo`;
            if (length >= 200) {
                charCounter.classList.remove('warning', 'danger');
                charCounter.style.color = '#34c759';
            } else if (length >= 150) {
                charCounter.classList.add('warning');
                charCounter.classList.remove('danger');
                charCounter.style.color = '#ff9f0a';
            } else {
                charCounter.classList.add('danger');
                charCounter.classList.remove('warning');
                charCounter.style.color = '#ff3b30';
            }
        }
        
        descriptionField.addEventListener('input', updateCharCounter);
        updateCharCounter();
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
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
            window.location.href = '../sv/login.html';
        }
        
        async function checkAuthState() {
            const session = getCurrentSession();
            if (session && session.user_id) {
                const { data: userData } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', session.user_id)
                    .single();
                if (userData) {
                    currentUser = userData;
                    if (userNameDisplay) userNameDisplay.textContent = userData.public_name || userData.username;
                    if (loginNav) loginNav.style.display = 'none';
                    if (logoutNav) logoutNav.style.display = 'flex';
                    if (sidebarAvatar && userData.avatar_url) {
                        sidebarAvatar.style.backgroundImage = `url('${userData.avatar_url}')`;
                        sidebarAvatar.querySelectorAll('.u-head, .u-body').forEach(el => el.style.opacity = '0');
                    }
                    if (toggleBtn && userData.avatar_url) {
                        toggleBtn.style.backgroundImage = `url('${userData.avatar_url}')`;
                        toggleBtn.querySelectorAll('.u-head, .u-body').forEach(el => el.style.opacity = '0');
                    }
                    await loadAllAddons();
                    addonTitleInput.addEventListener('input', checkDuplicateTitle);
                } else {
                    window.location.href = '../sv/login.html';
                }
            } else {
                window.location.href = '../sv/login.html';
            }
        }
        
        if (logoutNav) {
            logoutNav.addEventListener('click', async (e) => {
                e.preventDefault();
                logout();
            });
        }
        
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        const linksContainer = document.getElementById('linksContainer');
        const addLinkBtn = document.getElementById('addLinkBtn');
        
        function updateRemoveButtons() {
            const rows = linksContainer.querySelectorAll('.link-row');
            rows.forEach((row, index) => {
                const removeBtn = row.querySelector('.btn-remove-link');
                if (removeBtn) {
                    if (rows.length === 1) {
                        removeBtn.style.display = 'none';
                    } else {
                        removeBtn.style.display = 'flex';
                        removeBtn.onclick = () => {
                            row.remove();
                            updateRemoveButtons();
                            if (linksContainer.querySelectorAll('.link-row').length < 3) {
                                addLinkBtn.style.display = 'block';
                            }
                        };
                    }
                }
            });
        }
        
        addLinkBtn.addEventListener('click', () => {
            const rows = linksContainer.querySelectorAll('.link-row');
            if (rows.length < 3) {
                const newRow = document.createElement('div');
                newRow.className = 'link-row';
                newRow.innerHTML = `
                    <input type="text" class="link-name-input" placeholder="Nombre (Ej: Mediafire)" value="Download #${rows.length + 1}">
                    <input type="url" class="link-url-input" placeholder="https://ejemplo.com/archivo-addon" required>
                    <button type="button" class="btn-remove-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                    </button>
                `;
                linksContainer.appendChild(newRow);
                updateRemoveButtons();
                if (linksContainer.querySelectorAll('.link-row').length === 3) {
                    addLinkBtn.style.display = 'none';
                }
            }
        });
        
        updateRemoveButtons();
        
        function isValidImageUrl(url) {
            if (!url || typeof url !== 'string') return false;
            const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp)$/i;
            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.protocol !== 'https:') return false;
                const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
                const allowedDomains = [
                    'i.imgur.com',
                    'imgur.com', 
                    'i.ibb.co',
                    'ibb.co',
                    'cdn.discordapp.com',
                    'media.discordapp.net'
                ];
                const isAllowedDomain = allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
                if (!isAllowedDomain) return false;
                const pathLower = parsedUrl.pathname.toLowerCase();
                return imageExtensions.test(pathLower);
            } catch (e) {
                return false;
            }
        }
        
        function openModal(id, title) {
            activeTarget = document.getElementById(id);
            document.getElementById('modalTitle').textContent = title;
            modalInput.value = "";
            urlModal.classList.add('active');
            modalInput.focus();
        }
        
        document.getElementById('squareUpload').addEventListener('click', () => openModal('squareUpload', 'URL del Icono'));
        document.getElementById('bannerUpload').addEventListener('click', () => openModal('bannerUpload', 'URL de la Portada'));
        
        closeModal.addEventListener('click', () => urlModal.classList.remove('active'));
        saveModal.addEventListener('click', () => {
            const url = modalInput.value.trim();
            if (url && isValidImageUrl(url)) {
                const safeUrl = escapeHtml(url);
                activeTarget.innerHTML = `<img src="${safeUrl}" class="preview-img">`;
                if (activeTarget.id === 'squareUpload') {
                    iconUrl = url;
                } else if (activeTarget.id === 'bannerUpload') {
                    bannerUrl = url;
                }
                urlModal.classList.remove('active');
            } else {
                showNotification('URL no válida. Debe ser un enlace directo que termine en .jpg, .png, .jpeg, .webp o .gif. No uses enlaces de páginas como imgbb.com o postimg.cc', 'error');
            }
        });
        
document.getElementById('postForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const rawTitle = document.getElementById('addonTitle').value.trim();
            const rawDescription = document.getElementById('addonDescription').value.trim();
            const rawVersion = document.getElementById('addonVersion').value.trim();
            const rawTags = document.getElementById('addonTags').value.trim();
            const title = sanitizeInput(rawTitle, 100);
            const description = sanitizeInput(rawDescription, 5000);
            const version = sanitizeInput(rawVersion, 20);
            const tags = validateTags(rawTags);
            const platformBtn = document.querySelector('.platform-btn.active');
            const platform = sanitizeInput(platformBtn ? platformBtn.dataset.platform : 'Bedrock', 20);
            const downloadLinks = [];
            const linkNames = [];
            document.querySelectorAll('.link-row').forEach(row => {
                const nameInput = row.querySelector('.link-name-input');
                const urlInput = row.querySelector('.link-url-input');
                const rawUrl = urlInput.value.trim();
                const rawName = nameInput.value.trim();
                if (rawUrl && validateDownloadLink(rawUrl)) {
                    downloadLinks.push(rawUrl);
                    const rawNameStr = rawName || `Download #${downloadLinks.length}`;
                    const safeName = escapeHtml(sanitizeInput(rawNameStr, 50));
                    linkNames.push(safeName);
                }
            });
            if (!title || !description || !version || downloadLinks.length === 0) {
                showNotification('Por favor, completa todos los campos obligatorios.', 'error');
                return;
            }
            if (description.length < 200) {
                showNotification('La descripción debe tener al menos 200 caracteres. Actualmente tiene ' + description.length + ' caracteres.', 'error');
                return;
            }
            if (title.length < 3) {
                showNotification('El título debe tener al menos 3 caracteres.', 'error');
                return;
            }
            const normalizedTitle = normalizeString(title);
            const exists = allAddons.some(addon => normalizeString(addon.title) === normalizedTitle);
            if (exists) {
                showNotification('Este Complemento ya ha sido publicado. No puedes publicar un complemento con el mismo nombre.', 'warning');
                return;
            }
            if (iconUrl && !validateImageUrl(iconUrl)) {
                showNotification('URL de icono no válida.', 'error');
                return;
            }
            if (bannerUrl && !validateImageUrl(bannerUrl)) {
                showNotification('URL de banner no válida.', 'error');
                return;
            }
            const addonData = {
                addon_id: generateAddonId(),
                title: title,
                description: description,
                version: version,
                tags: tags,
                platform: platform,
                download_links: downloadLinks,
                link_names: linkNames,
                author_id: currentUser.id,
                author_name: currentUser.username,
                downloads: 0,
                featured: false,
                status: 'approved',
                publish_date: new Date().toISOString()
            };
            if (iconUrl && validateImageUrl(iconUrl)) {
                addonData.icon_url = iconUrl;
            }
            if (bannerUrl && validateImageUrl(bannerUrl)) {
                addonData.banner_url = bannerUrl;
            }
            try {
                const { error } = await supabaseClient
                    .from('addons')
                    .insert(addonData);
                if (error) throw error;
                showNotification('¡Tu addon ha sido publicado exitosamente!', 'success');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            } catch (error) {
                console.error('Error publishing addon:', error);
                showNotification('Error al publicar el addon. Intenta nuevamente.', 'error');
            }
        });
checkAuthState();
