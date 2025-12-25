// modules/views.js - Módulo de gerenciamento de views (ATUALIZADO COM CORREÇÃO DE VIEWS)

const ViewsModule = (() => {
    let isInitialized = false;
    
    const init = () => {
        isInitialized = true;
        console.log('Módulo Views inicializado');
        return true;
    };
    
    const renderView = (viewName) => {
        if (!isInitialized) {
            console.warn('Módulo Views não inicializado');
            return false;
        }
        
        console.log(`Renderizando view: ${viewName}`);
        
        switch (viewName) {
            case 'library':
                renderLibraryView();
                break;
            case 'categories':
                renderCategoriesView();
                break;
            case 'favorites':
                renderFavoritesView();
                break;
            case 'playlists':
                renderPlaylistsView();
                break;
            case 'settings':
                renderSettingsView();
                break;
            default:
                console.warn(`View desconhecida: ${viewName}`);
                return false;
        }
        
        return true;
    };
    
    const renderLibraryView = () => {
        if (!window.AppState?.hinos) return;
        
        let contentHTML = `
            <div class="library-view">
                <div class="view-header">
                    <h2><i class="fas fa-music"></i> Todos os Hinos</h2>
                    <p class="view-subtitle">${window.AppState.hinos.length} hinos disponíveis</p>
                </div>
                
                <div class="view-actions">
                    <button id="play-all-library" class="btn-primary">
                        <i class="fas fa-play-circle"></i> Reproduzir Todos
                    </button>
                    <button id="shuffle-library" class="btn-secondary">
                        <i class="fas fa-random"></i> Embaralhar
                    </button>
                </div>
                
                <div class="search-container" style="margin: var(--spacing-lg) 0;">
                    <input type="text" id="hino-search" placeholder="Buscar hinos por número ou título..." autocomplete="off">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="hinos-list" id="hinos-list">
                    <!-- Hinos serão carregadas aqui -->
                </div>
            </div>
        `;
        
        replaceMainContent(contentHTML);
        renderHinoList(window.AppState.hinos);
        
        // Adicionar eventos
        addLibraryActionsEvents();
        
        // Configurar busca
        setupSearch();
    };
    
    const renderCategoriesView = () => {
        // Delegar para módulo de categorias
        if (window.CategoriesModule) {
            window.CategoriesModule.renderCategoriesView();
        } else {
            let contentHTML = `
                <div class="categories-view">
                    <div class="view-header">
                        <h2><i class="fas fa-folder"></i> Categorias</h2>
                        <p class="view-subtitle">Módulo de categorias não disponível</p>
                    </div>
                    
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h3>Módulo não carregado</h3>
                        <p>O módulo de categorias não pôde ser carregado.</p>
                    </div>
                </div>
            `;
            
            replaceMainContent(contentHTML);
        }
    };
    
    const renderFavoritesView = () => {
        // Primeiro limpar a view atual
        clearCurrentView();
        
        // Delegar para módulo de favoritos
        if (window.FavoritesModule) {
            window.FavoritesModule.renderFavoritesView();
        } else {
            let contentHTML = `
                <div class="favorites-view">
                    <div class="view-header">
                        <h2><i class="fas fa-heart" style="color: #f44336;"></i> Hinos Favoritos</h2>
                        <p class="view-subtitle">Módulo de favoritos não disponível</p>
                    </div>
                    
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>Módulo não carregado</h3>
                        <p>O módulo de favoritos não pôde ser carregado.</p>
                    </div>
                </div>
            `;
            
            replaceMainContent(contentHTML);
        }
    };
    
    const renderPlaylistsView = () => {
        // Primeiro limpar a view atual
        clearCurrentView();
        
        // Delegar para módulo de playlists
        if (window.PlaylistsModule) {
            window.PlaylistsModule.renderPlaylistsView();
        } else {
            let contentHTML = `
                <div class="playlists-view">
                    <div class="view-header">
                        <h2><i class="fas fa-list"></i> Playlists</h2>
                        <p class="view-subtitle">Módulo de playlists não disponível</p>
                    </div>
                    
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Módulo não carregado</h3>
                        <p>O módulo de playlists não pôde ser carregado. Tente recarregar a página.</p>
                    </div>
                </div>
            `;
            
            replaceMainContent(contentHTML);
        }
    };
    
    const renderHistoryView = () => {
        // Primeiro limpar a view atual
        clearCurrentView();
        
        let contentHTML = `
            <div class="history-view">
                <div class="view-header">
                    <h2><i class="fas fa-history"></i> Histórico</h2>
                    <p class="view-subtitle">Em desenvolvimento</p>
                </div>
                
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Histórico em breve!</h3>
                    <p>Esta funcionalidade está em desenvolvimento.</p>
                </div>
            </div>
        `;
        
        replaceMainContent(contentHTML);
    };
    
const renderSettingsView = () => {
        // Limpar view atual
        clearCurrentView();
        
        // Delegar para o novo módulo
        if (window.SettingsModule) {
            window.SettingsModule.renderSettingsView();
        } else {
            // Fallback caso o script não tenha carregado
            let contentHTML = `
                <div class="settings-view">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Erro ao carregar</h3>
                        <p>O módulo de configurações não foi encontrado.</p>
                    </div>
                </div>
            `;
            replaceMainContent(contentHTML);
        }
    };
    
    // NOVA FUNÇÃO: Limpar view atual antes de renderizar outra
    const clearCurrentView = () => {
        const app = document.getElementById('app');
        const main = app?.querySelector('.app-main');
        if (!main) return;
        
        // Remover todas as views possíveis
        const allViews = main.querySelectorAll(`
            .library-view, 
            .favorites-view, 
            .playlists-view, 
            .history-view, 
            .settings-view, 
            .categories-view,
            .category-hinos-view,
            .playlist-detail-view
        `);
        
        allViews.forEach(view => {
            view.remove();
        });
    };
    
const renderHinoList = (hinos) => {
        const container = document.getElementById('hinos-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (hinos.length === 0) {
            // ... (código de empty state mantém igual) ...
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum hino encontrado</h3>
                    <p>Tente buscar com outros termos.</p>
                </div>
            `;
            return;
        }
        
        hinos.forEach(hino => {
            const isFavorite = window.FavoritesModule?.isFavorite(hino.id) || false;
            const isCurrent = window.AppState?.currentHino?.id === hino.id;
            
            const hinoItem = document.createElement('div');
            // Adiciona classe 'hino-item' para pegar o novo CSS
            hinoItem.className = `hino-item ${isCurrent ? 'active' : ''}`;
            hinoItem.dataset.id = hino.id;
            
            // HTML Simplificado para Lista
            hinoItem.innerHTML = `
                <div class="hino-info-main">
                    <div class="hino-number">${hino.numero}</div>
                    <div class="hino-details">
                        <div class="hino-title">${hino.titulo}</div>
                        <div class="hino-meta">
                            <i class="far fa-clock"></i> ${formatTime(hino.duracao)}
                        </div>
                    </div>
                </div>
                
                <div class="hino-actions">
                    <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                            data-action="favorite">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    
                    <button class="action-btn playlist-btn" data-action="playlist">
                        <i class="fas fa-list-ul"></i>
                    </button>
                    
                    <button class="action-btn play-btn" data-action="play">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(hinoItem);
        });
        
        addHinoListEvents();
    };
    
    const getPlaylistInfoForHino = (hinoId) => {
        if (!window.PlaylistsModule) return '';
        
        const allPlaylists = window.PlaylistsModule.getAllPlaylists();
        let playlistCount = 0;
        
        allPlaylists.forEach(playlist => {
            if (playlist.hinos.includes(hinoId)) {
                playlistCount++;
            }
        });
        
        if (playlistCount > 0) {
            return `<span class="playlist-badge" title="Em ${playlistCount} playlist(s)"><i class="fas fa-list"></i> ${playlistCount}</span>`;
        }
        
        return '';
    };
    
    const getCategoryInfoForHino = (hino) => {
        if (!window.CategoriesModule) return '';
        
        const categories = window.CategoriesModule.getAllCategories();
        const categoryNames = [];
        
        categories.forEach(category => {
            if (category.filter(hino)) {
                categoryNames.push(category.name);
            }
        });
        
        if (categoryNames.length > 0) {
            return `<span class="category-badge" title="${categoryNames.join(', ')}"><i class="fas fa-folder"></i> ${categoryNames.length}</span>`;
        }
        
        return '';
    };
    
    const addHinoListEvents = () => {
        const container = document.getElementById('hinos-list');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const hinoItem = e.target.closest('.hino-item');
            if (!hinoItem) return;
            
            const hinoId = parseInt(hinoItem.dataset.id);
            const hino = window.AppState?.hinos?.find(h => h.id === hinoId);
            if (!hino) return;
            
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                
                switch (action) {
                    case 'favorite':
                        handleFavoriteAction(hinoId, actionBtn, hinoItem);
                        break;
                        
                    case 'playlist':
                        handlePlaylistAction(hinoId, hinoItem);
                        break;
                        
                    case 'play':
                        playHinoAndClose(hino);
                        break;
                        
                    case 'queue':
                        addToQueue(hino);
                        break;
                }
            } else {
                // Clicou no item - reproduzir
                playHinoAndClose(hino);
            }
        });
    };
    
    const handleFavoriteAction = (hinoId, actionBtn, hinoItem) => {
        if (window.FavoritesModule) {
            const isNowFavorite = window.FavoritesModule.toggleFavorite(hinoId);
            const heartIcon = actionBtn.querySelector('i');
            
            if (isNowFavorite) {
                actionBtn.classList.add('active');
                actionBtn.title = 'Remover dos favoritos';
                heartIcon.className = 'fas fa-heart';
            } else {
                actionBtn.classList.remove('active');
                actionBtn.title = 'Adicionar aos favoritos';
                heartIcon.className = 'far fa-heart';
            }
            
            // Atualizar contador na UI
            if (window.elements?.favoritesCount) {
                window.elements.favoritesCount.textContent = window.FavoritesModule.getCount();
            }
        }
    };
    
    const handlePlaylistAction = (hinoId, hinoItem) => {
        if (!window.PlaylistsModule) {
            showToast('Módulo de playlists não disponível', 'error');
            return;
        }
        
        showPlaylistDropdown(hinoId, hinoItem);
    };
    
    const showPlaylistDropdown = (hinoId, hinoItem) => {
        const playlists = window.PlaylistsModule.getUserPlaylists();
        const button = hinoItem.querySelector('.playlist-btn');
        const rect = button.getBoundingClientRect();
        
        // Remover dropdown existente
        const existingDropdown = document.querySelector('.playlist-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        const dropdownHTML = `
            <div class="playlist-dropdown show" style="position: fixed; top: ${rect.bottom + 8}px; left: ${rect.left}px; transform: translateX(-50%);">
                <div class="playlist-dropdown-header">
                    <i class="fas fa-list"></i> Adicionar à Playlist
                </div>
                <div class="playlist-dropdown-list">
                    ${playlists.length === 0 ? `
                        <div class="empty-dropdown" style="padding: var(--spacing-md); text-align: center; color: var(--text-secondary);">
                            <i class="fas fa-inbox" style="font-size: 1.5rem; margin-bottom: var(--spacing-sm);"></i>
                            <p>Nenhuma playlist criada</p>
                        </div>
                    ` : playlists.map(playlist => {
                        const hasHino = playlist.hinos.includes(hinoId);
                        return `
                            <div class="playlist-dropdown-item ${hasHino ? 'has-hino' : ''}" data-playlist-id="${playlist.id}">
                                <div class="playlist-dropdown-info">
                                    <i class="${playlist.icon}" style="color: ${playlist.color}"></i>
                                    <span>${playlist.name}</span>
                                </div>
                                ${hasHino ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="playlist-dropdown-footer">
                    <button class="btn-text" id="create-new-playlist-from-dropdown">
                        <i class="fas fa-plus"></i> Nova Playlist
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dropdownHTML);
        
        // Eventos do dropdown
        const dropdown = document.querySelector('.playlist-dropdown');
        
        // Adicionar/remover da playlist
        dropdown.querySelectorAll('.playlist-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const playlistId = item.dataset.playlistId;
                const hasHino = item.classList.contains('has-hino');
                
                if (hasHino) {
                    window.PlaylistsModule.removeHinoFromPlaylist(playlistId, hinoId);
                    item.classList.remove('has-hino');
                    item.querySelector('.fa-check')?.remove();
                } else {
                    window.PlaylistsModule.addHinoToPlaylist(playlistId, hinoId);
                    item.classList.add('has-hino');
                    item.innerHTML += '<i class="fas fa-check"></i>';
                }
                
                // Atualizar badge na lista
                const newPlaylistInfo = getPlaylistInfoForHino(hinoId);
                const badgeContainer = hinoItem.querySelector('.hino-meta .playlist-badge');
                
                if (newPlaylistInfo) {
                    if (badgeContainer) {
                        badgeContainer.outerHTML = newPlaylistInfo;
                    } else {
                        const metaContainer = hinoItem.querySelector('.hino-meta');
                        metaContainer.insertAdjacentHTML('beforeend', newPlaylistInfo);
                    }
                } else if (badgeContainer) {
                    badgeContainer.remove();
                }
            });
        });
        
        // Criar nova playlist
        const createBtn = dropdown.querySelector('#create-new-playlist-from-dropdown');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                dropdown.remove();
                if (window.PlaylistsModule) {
                    window.PlaylistsModule.showCreatePlaylistModal();
                    
                    // Após criar a playlist, adicionar o hino
                    const originalCreate = window.PlaylistsModule.createPlaylist;
                    window.PlaylistsModule.createPlaylist = function(name, description, color, icon) {
                        const newPlaylist = originalCreate.call(this, name, description, color, icon);
                        if (newPlaylist) {
                            window.PlaylistsModule.addHinoToPlaylist(newPlaylist.id, hinoId);
                            
                            // Atualizar badge
                            const newPlaylistInfo = getPlaylistInfoForHino(hinoId);
                            const badgeContainer = hinoItem.querySelector('.hino-meta .playlist-badge');
                            
                            if (newPlaylistInfo) {
                                if (badgeContainer) {
                                    badgeContainer.outerHTML = newPlaylistInfo;
                                } else {
                                    const metaContainer = hinoItem.querySelector('.hino-meta');
                                    metaContainer.insertAdjacentHTML('beforeend', newPlaylistInfo);
                                }
                            }
                        }
                        window.PlaylistsModule.createPlaylist = originalCreate;
                        return newPlaylist;
                    };
                }
            });
        }
        
        // Fechar dropdown ao clicar fora
        const clickHandler = (e) => {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.remove();
                document.removeEventListener('click', clickHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', clickHandler);
        }, 10);
    };
    
    const playHinoAndClose = (hino) => {
        if (window.playHino) {
            window.playHino(hino);
            
            // Adicionar ao histórico de reprodução
            if (window.PlaylistsModule) {
                window.PlaylistsModule.addToRecentlyPlayed(hino.id);
            }
        }
        if (window.closeMenu) {
            window.closeMenu();
        }
    };
    
    const addToQueue = (hino) => {
        if (window.AppState?.queue) {
            window.AppState.queue.push(hino);
            showToast(`${hino.numero} - ${hino.titulo} adicionado à fila`, 'success');
        }
    };
    
    const addLibraryActionsEvents = () => {
        // Reproduzir todos
        const playAllBtn = document.getElementById('play-all-library');
        if (playAllBtn) {
            playAllBtn.addEventListener('click', () => {
                if (!window.AppState?.hinos) return;
                
                window.AppState.queue = [...window.AppState.hinos];
                
                if (window.playHino && window.AppState.hinos.length > 0) {
                    window.playHino(window.AppState.hinos[0]);
                    showToast(`Reproduzindo ${window.AppState.hinos.length} hinos`, 'success');
                }
                
                if (window.closeMenu) {
                    window.closeMenu();
                }
            });
        }
        
        // Embaralhar
        const shuffleBtn = document.getElementById('shuffle-library');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                if (!window.AppState?.hinos) return;
                
                const shuffled = [...window.AppState.hinos].sort(() => Math.random() - 0.5);
                window.AppState.queue = shuffled;
                
                if (window.playHino && shuffled.length > 0) {
                    window.playHino(shuffled[0]);
                    showToast('Hinos embaralhados', 'success');
                }
                
                if (window.closeMenu) {
                    window.closeMenu();
                }
            });
        }
    };
    
    const setupSearch = () => {
        const searchInput = document.getElementById('hino-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterHinoList(query);
            });
        }
    };
    
    const filterHinoList = (query) => {
        if (!window.AppState?.hinos) return;
        
        if (!query) {
            renderHinoList(window.AppState.hinos);
            return;
        }
        
        const filteredHinos = window.AppState.hinos.filter(hino => {
            return hino.numero.includes(query) || 
                   hino.titulo.toLowerCase().includes(query.toLowerCase());
        });
        
        renderHinoList(filteredHinos);
    };
    
    const replaceMainContent = (contentHTML) => {
        const app = document.getElementById('app');
        const main = app?.querySelector('.app-main');
        if (!main) return;
        
        // Remover player container se existir
        const playerContainer = main.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.remove();
        }
        
        // Remover outras views
        const views = main.querySelectorAll(`
            .library-view, 
            .favorites-view, 
            .playlists-view, 
            .history-view, 
            .settings-view, 
            .categories-view,
            .category-hinos-view,
            .playlist-detail-view
        `);
        views.forEach(view => view.remove());
        
        // Adicionar nova view
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHTML;
        main.appendChild(tempDiv.firstElementChild);
    };
    
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    return {
        init,
        renderView,
        renderLibraryView,
        renderCategoriesView,
        renderFavoritesView,
        renderPlaylistsView,
        renderHinoList,
        filterHinoList,
        clearCurrentView,
        replaceMainContent
    };
})();

window.ViewsModule = ViewsModule;
console.log('Módulo Views carregado');