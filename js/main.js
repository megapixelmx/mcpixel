const supabaseUrl = 'https://tauciflgtvuuoqqxzucy.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdWNpZmxndHZ1dW9xcXh6dWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY1NTUsImV4cCI6MjA5MDY0MjU1NX0.z8eV2KRnq16C5obuyPKhUmeJnGfci9lH-o40QIJuJ5o';
        const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggleBtn');
        const navbar = document.getElementById('mainNavbar');
        const filterBar = document.getElementById('filterBar');
        const filterTrigger = document.getElementById('filterTrigger');
        const filterModalOverlay = document.getElementById('modalOverlay');
        const filterOptions = document.querySelectorAll('.filter-option-btn');
        const filterNameSpan = document.querySelector('.filter-name');
        const searchInput = document.getElementById('searchInput');
        const searchDropdown = document.getElementById('searchDropdown');
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
        
        let currentUser = null;
        let currentUserData = null;
        let currentFilter = 'default';
        let allAddons = [];
        let usersCache = {};
        let searchAnimationInterval = null;
        let currentPlaceholderIndex = 0;
        let placeholderAddons = [];
        
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
        
        async function getAllAddonsFromDB() {
            const { data, error } = await supabaseClient
                .from('addons')
                .select('*')
                .eq('status', 'approved')
                .order('publish_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
        
        async function getUserVerifiedStatus(username) {
            if (usersCache[username]) {
                return usersCache[username];
            }
            const { data, error } = await supabaseClient
                .from('users')
                .select('is_verified, username, public_name')
                .eq('username', username)
                .single();
            if (!error && data) {
                usersCache[username] = data;
                return data;
            }
            return { is_verified: false, username: username, public_name: username };
        }
        
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
                    if (userNameDisplay) {
                        userNameDisplay.textContent = userData.public_name || userData.username;
                    }
                    if (sidebarAvatar && userData.avatar_url) {
                        sidebarAvatar.style.backgroundImage = `url('${userData.avatar_url}')`;
                        const head = sidebarAvatar.querySelector('.u-head');
                        const body = sidebarAvatar.querySelector('.u-body');
                        if (head) head.style.opacity = '0';
                        if (body) body.style.opacity = '0';
                    }
                    if (profileTrigger && userData.avatar_url) {
                        profileTrigger.style.backgroundImage = `url('${userData.avatar_url}')`;
                        const head = profileTrigger.querySelector('.u-head');
                        const body = profileTrigger.querySelector('.u-body');
                        if (head) head.style.opacity = '0';
                        if (body) body.style.opacity = '0';
                    }
                }
            } else {
                currentUser = null;
                if (loginNav) loginNav.style.display = 'flex';
                if (registerNav) registerNav.style.display = 'flex';
                if (logoutNav) logoutNav.style.display = 'none';
                if (publishNav) publishNav.classList.add('disabled');
                if (settingsNav) settingsNav.classList.add('disabled');
                if (userNameDisplay) userNameDisplay.textContent = 'Invitado';
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = 'none';
                    const head = sidebarAvatar.querySelector('.u-head');
                    const body = sidebarAvatar.querySelector('.u-body');
                    if (head) head.style.opacity = '1';
                    if (body) body.style.opacity = '1';
                }
                if (profileTrigger) {
                    profileTrigger.style.backgroundImage = 'none';
                    const head = profileTrigger.querySelector('.u-head');
                    const body = profileTrigger.querySelector('.u-body');
                    if (head) head.style.opacity = '1';
                    if (body) body.style.opacity = '1';
                }
            }
        }
        
        function logout() {
            localStorage.removeItem('mc_session');
            localStorage.removeItem('mc_user');
            showNotification('Sesión cerrada correctamente');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
        
        if (profileSection) {
            profileSection.addEventListener('click', function(e) {
                e.preventDefault();
                if (currentUser) {
                    window.location.href = 'sc/profile.html';
                } else {
                    showNotification('Debes iniciar sesión para ver tu perfil');
                }
            });
        }
        
        if (logoutNav) {
            logoutNav.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
                if (filterBar) filterBar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
                if (filterBar) filterBar.classList.remove('scrolled');
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
        
        if (filterTrigger) {
            filterTrigger.addEventListener('click', () => {
                filterModalOverlay.classList.add('active');
            });
        }
        
        filterModalOverlay.addEventListener('click', function(e) {
            if (e.target === filterModalOverlay) {
                filterModalOverlay.classList.remove('active');
            }
        });
        
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                filterOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const filterText = this.textContent.trim();
                filterNameSpan.textContent = `Ordenar por: ${filterText}`;
                currentFilter = this.dataset.filter;
                filterModalOverlay.classList.remove('active');
                filterAndSortAddons(currentFilter);
            });
        });
        
        function weightedRandomShuffle(addons) {
            const featuredAddons = addons.filter(a => a.featured === true);
            const normalAddons = addons.filter(a => a.featured !== true);
            const result = [];
            const featuredWeight = 0.4;
            const normalWeight = 0.6;
            let featuredIndex = 0;
            let normalIndex = 0;
            const shuffledFeatured = [...featuredAddons];
            const shuffledNormal = [...normalAddons];
            for (let i = shuffledFeatured.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledFeatured[i], shuffledFeatured[j]] = [shuffledFeatured[j], shuffledFeatured[i]];
            }
            for (let i = shuffledNormal.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledNormal[i], shuffledNormal[j]] = [shuffledNormal[j], shuffledNormal[i]];
            }
            while (featuredIndex < shuffledFeatured.length || normalIndex < shuffledNormal.length) {
                const useFeatured = (featuredIndex < shuffledFeatured.length) && (normalIndex >= shuffledNormal.length || Math.random() < featuredWeight);
                if (useFeatured) {
                    result.push(shuffledFeatured[featuredIndex]);
                    featuredIndex++;
                } else if (normalIndex < shuffledNormal.length) {
                    result.push(shuffledNormal[normalIndex]);
                    normalIndex++;
                }
            }
            return result;
        }
        
        function filterAndSortAddons(filterType) {
            let addons = [...allAddons];
            const container = document.getElementById('addonsListContainer');
            if (!container) return;
            
            if (filterType === 'default') {
                addons = weightedRandomShuffle(addons);
            } else {
                switch(filterType) {
                    case 'popular':
                        addons.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                        break;
                    case 'recent':
                        addons.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
                        break;
                    case 'downloaded':
                        addons.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                        break;
                    case 'updated':
                        addons.sort((a, b) => {
                            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(a.publish_date);
                            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(b.publish_date);
                            return dateB - dateA;
                        });
                        break;
                    case 'random':
                        for (let i = addons.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [addons[i], addons[j]] = [addons[j], addons[i]];
                        }
                        break;
                }
            }
            renderAddons(addons);
        }
        
        function formatBoldText(text) {
            if (!text) return '';
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        
        async function renderAddons(addons) {
            const container = document.getElementById('addonsListContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (addons.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #a1a1a6;">No hay addons publicados. ¡Sé el primero en publicar!</div>';
                return;
            }
            
            for (const addon of addons) {
                const publishDate = new Date(addon.publish_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
                const updatedDate = addon.updated_at ? new Date(addon.updated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : publishDate;
                const cardImage = addon.icon_url || addon.banner_url || 'img/default-addon.png';
                const authorName = addon.author_name || 'Usuario';
                const downloads = formatNumber(addon.downloads || 0);
                const platform = addon.platform || 'Bedrock';
                const version = addon.version || 'v1.0.0';
                const formattedDescription = formatBoldText(addon.description);
                
                let userVerified = false;
                let userPublicName = authorName;
                try {
                    const userInfo = await getUserVerifiedStatus(authorName);
                    userVerified = userInfo.is_verified === true;
                    userPublicName = userInfo.public_name || authorName;
                } catch (e) {
                    console.error('Error fetching user verification:', e);
                }
                
                const card = document.createElement('article');
                card.className = 'addon-card';
                card.style.cursor = 'pointer';
                
                const flameIcon = addon.featured ? '<svg class="flame-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clip-rule="evenodd" /></svg><div class="flame-tooltip">Complemento Destacado</div>' : '';
                
                const verifiedIcon = userVerified ? '<svg class="author-verified-icon" viewBox="0 0 24 24" style="fill: #1d9bf0; width: 14px; height: 14px; margin-left: 3px; vertical-align: middle;"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81C14.67 2.53 13.43 1.65 12 1.65s-2.67.88-3.34 2.19c-1.39-.46-2.97-.2-4.01.81s-1.27 2.62-.81 4.01C2.53 9.33 1.65 10.57 1.65 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.01s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 4.01-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"></path></svg>' : '';
                
                card.innerHTML = `
                    ${flameIcon}
                    <img src="${cardImage}" alt="${addon.title}" class="addon-logo" onerror="this.src='img/default-addon.png'">
                    <div class="addon-content">
                        <h2 class="addon-title">${addon.title}</h2>
                        <div class="author-row">
                            By <span>${escapeHtml(userPublicName)}</span>${verifiedIcon}
                        </div>
                        <p class="addon-desc">${formattedDescription}</p>
                        <div class="addon-meta">
                            <div class="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                ${downloads}
                            </div>
                            <div class="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                ${publishDate}
                            </div>
                            <div class="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                                </svg>
                                ${updatedDate}
                            </div>
                            <div class="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                                </svg>
                                ${version}
                            </div>
                            <span class="platform-tag">${platform}</span>
                        </div>
                    </div>
                `;
                
                card.addEventListener('click', function() {
                    localStorage.setItem('selectedAddon', JSON.stringify(addon));
                    window.location.href = 'sc/view.html';
                });
                
                container.appendChild(card);
            }
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function startSearchPlaceholderAnimation() {
            if (searchAnimationInterval) {
                clearInterval(searchAnimationInterval);
            }
            
            if (!placeholderAddons.length || !searchInput) return;
            
            let currentIndex = 0;
            
            function updatePlaceholder() {
                if (!searchInput) return;
                const addonName = placeholderAddons[currentIndex].title;
                searchInput.placeholder = `Buscar: ${addonName}`;
                currentIndex = (currentIndex + 1) % placeholderAddons.length;
            }
            
            updatePlaceholder();
            searchAnimationInterval = setInterval(updatePlaceholder, 3000);
        }
        
        function stopSearchPlaceholderAnimation() {
            if (searchAnimationInterval) {
                clearInterval(searchAnimationInterval);
                searchAnimationInterval = null;
            }
        }
        
        function performSearch() {
            const query = searchInput.value.toLowerCase().trim();
            if (query === '') {
                filterAndSortAddons(currentFilter);
                return;
            }
            const filtered = allAddons.filter(addon => 
                addon.title.toLowerCase().includes(query) ||
                (addon.author_name && addon.author_name.toLowerCase().includes(query)) ||
                addon.description.toLowerCase().includes(query)
            );
            let sortedFiltered = [...filtered];
            switch(currentFilter) {
                case 'popular':
                case 'downloaded':
                    sortedFiltered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                    break;
                case 'recent':
                    sortedFiltered.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
                    break;
                case 'updated':
                    sortedFiltered.sort((a, b) => {
                        const dateA = a.updated_at ? new Date(a.updated_at) : new Date(a.publish_date);
                        const dateB = b.updated_at ? new Date(b.updated_at) : new Date(b.publish_date);
                        return dateB - dateA;
                    });
                    break;
                case 'random':
                    for (let i = sortedFiltered.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [sortedFiltered[i], sortedFiltered[j]] = [sortedFiltered[j], sortedFiltered[i]];
                    }
                    break;
                default:
                    sortedFiltered = weightedRandomShuffle(sortedFiltered);
            }
            renderAddons(sortedFiltered);
            searchDropdown.classList.remove('active');
        }
        
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                stopSearchPlaceholderAnimation();
                searchInput.placeholder = 'Buscar addons por nombre, autor o descripción...';
            });
            
            searchInput.addEventListener('blur', function() {
                if (searchInput.value === '') {
                    startSearchPlaceholderAnimation();
                }
            });
            
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
            });
        }
        
        searchInput.addEventListener('input', async function() {
            const query = this.value.toLowerCase().trim();
            if (query === '') {
                searchDropdown.classList.remove('active');
                return;
            }
            const filtered = allAddons.filter(addon => 
                addon.title.toLowerCase().includes(query) ||
                (addon.author_name && addon.author_name.toLowerCase().includes(query)) ||
                addon.description.toLowerCase().includes(query)
            );
            if (filtered.length > 0) {
                let html = '<div class="dropdown-header">Resultados de búsqueda</div>';
                for (const addon of filtered) {
                    const imageUrl = addon.icon_url || addon.banner_url || 'img/default-addon.png';
                    let userVerified = false;
                    let userPublicName = addon.author_name || 'Usuario';
                    try {
                        const userInfo = await getUserVerifiedStatus(addon.author_name);
                        userVerified = userInfo.is_verified === true;
                        userPublicName = userInfo.public_name || addon.author_name;
                    } catch (e) {}
                    const verifiedIcon = userVerified ? '<svg viewBox="0 0 24 24" style="fill: #1d9bf0; width: 13px; height: 13px; margin-left: 3px;"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81C14.67 2.53 13.43 1.65 12 1.65s-2.67.88-3.34 2.19c-1.39-.46-2.97-.2-4.01.81s-1.27 2.62-.81 4.01C2.53 9.33 1.65 10.57 1.65 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.01s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 4.01-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"></path></svg>' : '';
                    html += `
                        <div class="dropdown-item" data-addon-id="${addon.id}">
                            <img src="${imageUrl}" alt="${addon.title}" class="dropdown-item-image" onerror="this.src='img/default-addon.png'">
                            <div class="dropdown-item-info">
                                <div class="dropdown-item-title">${escapeHtml(addon.title)}</div>
                                <div class="dropdown-item-author" style="display: flex; align-items: center; gap: 2px;">
                                    By ${escapeHtml(userPublicName)}${verifiedIcon}
                                </div>
                            </div>
                        </div>
                    `;
                }
                searchDropdown.innerHTML = html;
                document.querySelectorAll('.dropdown-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const titleElement = this.querySelector('.dropdown-item-title');
                        if (titleElement) {
                            const addonTitle = titleElement.textContent;
                            const addon = filtered.find(a => a.title === addonTitle);
                            if (addon) {
                                localStorage.setItem('selectedAddon', JSON.stringify(addon));
                                window.location.href = 'sc/view.html';
                            }
                        }
                    });
                });
                searchDropdown.classList.add('active');
            } else {
                searchDropdown.innerHTML = `<div class="dropdown-no-results"><img src="img/ic3.png" alt="No results"><p>No se encontraron resultados para "${query}"</p></div>`;
                searchDropdown.classList.add('active');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!searchDropdown.contains(e.target) && e.target !== searchInput) {
                searchDropdown.classList.remove('active');
            }
        });
        
        let carouselInterval;
        let currentSlideIndex = 0;
        let carouselSlides = [];
        
        async function initializeCarousel() {
            if (!allAddons.length) return;
            
            const usedAddonIds = new Set();
            
            const mostDownloaded = [...allAddons].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];
            if (mostDownloaded) usedAddonIds.add(mostDownloaded.id);
            
            const minecraftAddon = allAddons.find(a => a.id === '3e7df795-7a94-4857-a2e4-a0315f1c1c25');
            if (minecraftAddon) usedAddonIds.add(minecraftAddon.id);
            
            let mostRecent = null;
            for (const addon of [...allAddons].sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date))) {
                if (!usedAddonIds.has(addon.id)) {
                    mostRecent = addon;
                    usedAddonIds.add(addon.id);
                    break;
                }
            }
            
            let recommendationOfTheDay = null;
            const storedRecommendation = localStorage.getItem('dailyRecommendation');
            const today = new Date().toDateString();
            
            if (storedRecommendation) {
                const recommendation = JSON.parse(storedRecommendation);
                if (recommendation.date === today) {
                    const foundAddon = allAddons.find(a => a.id === recommendation.addonId);
                    if (foundAddon && !usedAddonIds.has(foundAddon.id)) {
                        recommendationOfTheDay = foundAddon;
                        usedAddonIds.add(foundAddon.id);
                    }
                }
            }
            
            if (!recommendationOfTheDay) {
                const availableAddons = allAddons.filter(a => !usedAddonIds.has(a.id));
                if (availableAddons.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableAddons.length);
                    recommendationOfTheDay = availableAddons[randomIndex];
                    usedAddonIds.add(recommendationOfTheDay.id);
                    localStorage.setItem('dailyRecommendation', JSON.stringify({
                        addonId: recommendationOfTheDay.id,
                        date: today
                    }));
                } else {
                    recommendationOfTheDay = allAddons.find(a => !usedAddonIds.has(a.id)) || allAddons[0];
                    if (recommendationOfTheDay) usedAddonIds.add(recommendationOfTheDay.id);
                }
            }
            
            let extraBanner = null;
            const availableForExtra = allAddons.filter(a => !usedAddonIds.has(a.id));
            if (availableForExtra.length > 0) {
                extraBanner = availableForExtra[Math.floor(Math.random() * availableForExtra.length)];
                usedAddonIds.add(extraBanner.id);
            } else {
                extraBanner = allAddons[0];
                if (extraBanner) usedAddonIds.add(extraBanner.id);
            }
            
            carouselSlides = [];
            
            if (mostDownloaded) {
                carouselSlides.push({ type: 'mostDownloaded', addon: mostDownloaded, title: 'Más Descargado' });
            }
            
            if (minecraftAddon) {
                carouselSlides.push({ type: 'minecraft', addon: minecraftAddon, title: 'Minecraft Oficial' });
            }
            
            if (mostRecent) {
                carouselSlides.push({ type: 'mostRecent', addon: mostRecent, title: 'Más Reciente' });
            }
            
            if (recommendationOfTheDay) {
                carouselSlides.push({ type: 'recommendation', addon: recommendationOfTheDay, title: 'Recomendación del Día' });
            }
            
            if (extraBanner) {
                carouselSlides.push({ type: 'extra', addon: extraBanner, title: 'Destacado' });
            }
            
            renderCarousel();
            startCarouselAutoPlay();
            
            const prevBtn = document.getElementById('carouselPrev');
            const nextBtn = document.getElementById('carouselNext');
            if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
            if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
        }
        
        function renderCarousel() {
            const track = document.getElementById('carouselTrack');
            const dotsContainer = document.getElementById('carouselDots');
            if (!track || !dotsContainer) return;
            
            track.innerHTML = '';
            dotsContainer.innerHTML = '';
            
            carouselSlides.forEach((slide, index) => {
                const addon = slide.addon;
                if (!addon) return;
                
                const bannerUrl = addon.banner_url || addon.icon_url || 'img/default-banner.png';
                const iconUrl = addon.icon_url || bannerUrl;
                
                const slideElement = document.createElement('div');
                slideElement.className = 'carousel-slide';
                slideElement.style.backgroundImage = `url('${bannerUrl}')`;
                slideElement.innerHTML = `
                    <div class="slide-info">
                        <img src="${iconUrl}" alt="${addon.title}" class="slide-icon" onerror="this.src='img/default-addon.png'">
                        <div class="slide-text">
                            <div class="slide-title">${escapeHtml(addon.title.length > 50 ? addon.title.substring(0, 47) + '...' : addon.title)}</div>
                            <div class="slide-author">By ${escapeHtml(addon.author_name || 'Usuario')}</div>
                            <div class="slide-description">${escapeHtml(addon.description ? (addon.description.length > 100 ? addon.description.substring(0, 97) + '...' : addon.description) : 'Sin descripción')}</div>
                        </div>
                    </div>
                `;
                
                slideElement.addEventListener('click', () => {
                    localStorage.setItem('selectedAddon', JSON.stringify(addon));
                    window.location.href = 'sc/view.html';
                });
                
                track.appendChild(slideElement);
                
                const dot = document.createElement('div');
                dot.className = `dot ${index === currentSlideIndex ? 'active' : ''}`;
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            });
            
            updateCarouselPosition();
        }
        
        function updateCarouselPosition() {
            const track = document.getElementById('carouselTrack');
            if (track) {
                track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
            }
            const dots = document.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                if (index === currentSlideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        function changeSlide(direction) {
            currentSlideIndex = (currentSlideIndex + direction + carouselSlides.length) % carouselSlides.length;
            updateCarouselPosition();
            resetCarouselAutoPlay();
        }
        
        function goToSlide(index) {
            currentSlideIndex = index;
            updateCarouselPosition();
            resetCarouselAutoPlay();
        }
        
        function startCarouselAutoPlay() {
            if (carouselInterval) clearInterval(carouselInterval);
            carouselInterval = setInterval(() => {
                changeSlide(1);
            }, 5000);
        }
        
        function resetCarouselAutoPlay() {
            if (carouselInterval) clearInterval(carouselInterval);
            carouselInterval = setInterval(() => {
                changeSlide(1);
            }, 5000);
        }
        
        async function initializeAddons() {
            try {
                allAddons = await getAllAddonsFromDB();
                filterAndSortAddons(currentFilter);
                await initializeCarousel();
                
                placeholderAddons = [...allAddons];
                if (placeholderAddons.length > 0) {
                    startSearchPlaceholderAnimation();
                }
            } catch (error) {
                console.error('Error loading addons:', error);
                showNotification('Error al cargar los addons');
            }
        }
        
        initializeAddons();
        checkAuthState();
