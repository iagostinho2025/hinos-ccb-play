// modules/categories.js - Módulo de Gerenciamento de Categorias

const CategoriesModule = (() => {
    let isInitialized = false;
    
    // Definição das categorias
    const CATEGORIES = [
        {
            id: 'geral',
            name: 'Geral',
            description: 'Todos os hinos exceto Funeral',
            icon: 'fas fa-globe',
            color: '#4CAF50',
            filter: (hino) => {
                const funeralNumbers = ['426', '427', '428', '429', '430'];
                return !funeralNumbers.includes(hino.numero);
            }
        },
        {
            id: 'culto-oficial',
            name: 'Culto Oficial',
            description: 'Hinos 1 ao 430',
            icon: 'fas fa-church',
            color: '#2196F3',
            filter: (hino) => {
                const numero = parseInt(hino.numero);
                return numero >= 1 && numero <= 430;
            }
        },
        {
            id: 'jovens',
            name: 'Reunião de Jovens',
            description: 'Hinos 431 ao 480',
            icon: 'fas fa-users',
            color: '#FF9800',
            filter: (hino) => {
                const numero = parseInt(hino.numero);
                return numero >= 431 && numero <= 480;
            }
        },
        {
            id: 'funeral',
            name: 'Funeral',
            description: 'Hinos específicos para momentos de despedida',
            icon: 'fas fa-pray',
            color: '#607D8B',
            filter: (hino) => {
                const funeralNumbers = ['426', '427', '428', '429', '430'];
                return funeralNumbers.includes(hino.numero);
            }
        }
    ];
    
    const init = async () => {
        try {
            isInitialized = true;
            console.log('Módulo Categorias inicializado');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar módulo Categorias:', error);
            return false;
        }
    };
    
    const getAllCategories = () => {
        return [...CATEGORIES];
    };
    
    const getCategory = (categoryId) => {
        return CATEGORIES.find(cat => cat.id === categoryId);
    };
    
    const getHinosByCategory = (categoryId) => {
        if (!window.AppState?.hinos) return [];
        
        const category = getCategory(categoryId);
        if (!category) return [];
        
        return window.AppState.hinos.filter(category.filter);
    };
    
    const getCategoryStats = () => {
        if (!window.AppState?.hinos) return {};
        
        const stats = {};
        CATEGORIES.forEach(category => {
            const hinos = window.AppState.hinos.filter(category.filter);
            stats[category.id] = {
                count: hinos.length,
                percentage: Math.round((hinos.length / window.AppState.hinos.length) * 100)
            };
        });
        
        return stats;
    };
    
    const playCategory = (categoryId) => {
        const categoryHinos = getHinosByCategory(categoryId);
        
        if (categoryHinos.length === 0) {
            showToast('Não há hinos nesta categoria', 'info');
            return false;
        }
        
        if (window.AppState) {
            window.AppState.queue = [...categoryHinos];
            
            const firstHino = categoryHinos[0];
            if (window.playHino) {
                window.playHino(firstHino);
                showToast(`Reproduzindo "${getCategory(categoryId)?.name}" (${categoryHinos.length} hinos)`, 'success');
            }
            
            if (window.closeMenu) {
                window.closeMenu();
            }
        }
        
        return true;
    };
    
const renderCategoriesView = () => {
    // PRIMEIRO: Limpar qualquer view existente
    if (window.ViewsModule?.clearCurrentView) {
        window.ViewsModule.clearCurrentView();
    } else {
        // Fallback manual
        const app = document.getElementById('app');
        const main = app?.querySelector('.app-main');
        if (main) {
            const views = main.querySelectorAll('.library-view, .favorites-view, .playlists-view, .settings-view, .category-hinos-view, .playlist-detail-view');
            views.forEach(view => view.remove());
        }
    }
    
    // HTML Simplificado (Sem estatísticas, apenas a grade)
    let contentHTML = `
        <div class="categories-view fade-in">
            <div class="view-header text-center"> <h2><i class="fas fa-folder"></i> Categorias</h2>
                <p class="view-subtitle">Selecione uma ocasião</p>
            </div>
            
            <div class="categories-grid" id="categories-grid">
                </div>
        </div>
    `;
    
    replaceMainContent(contentHTML);
    renderCategoriesGrid();
    addCategoriesEvents();
};;
    
    const renderCategoriesGrid = () => {
        const container = document.getElementById('categories-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        CATEGORIES.forEach(category => {
            const hinos = getHinosByCategory(category.id);
            const stats = getCategoryStats();
            
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.dataset.id = category.id;
            
            categoryCard.innerHTML = `
                <div class="category-header" style="background: ${category.color}20; border-left: 4px solid ${category.color}">
                    <div class="category-icon" style="color: ${category.color}">
                        <i class="${category.icon}"></i>
                    </div>
                    <div class="category-info">
                        <h3 class="category-title">${category.name}</h3>
                        <p class="category-description">${category.description}</p>
                    </div>
                </div>
                <div class="category-body">
                    <div class="category-stats">
                        <div class="stat">
                            <i class="fas fa-music"></i>
                            <span>${hinos.length} hinos</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <span>${formatCategoryDuration(hinos)} min</span>
                        </div>
                    </div>
                    <div class="category-examples">
                        <div class="examples-label">Exemplos:</div>
                        <div class="examples-list">
                            ${hinos.slice(0, 3).map(hino => 
                                `<span class="example-hino">${hino.numero}</span>`
                            ).join('')}
                            ${hinos.length > 3 ? `<span class="example-more">+${hinos.length - 3}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn-primary btn-sm category-play-btn">
                        <i class="fas fa-play"></i> Reproduzir
                    </button>
                    <button class="btn-text btn-sm category-view-btn">
                        <i class="fas fa-eye"></i> Ver Hinos
                    </button>
                </div>
            `;
            
            container.appendChild(categoryCard);
        });
    };
    
    const renderCategoryHinosView = (categoryId) => {
        const category = getCategory(categoryId);
        if (!category) return;
        
        const categoryHinos = getHinosByCategory(categoryId);
        
        let contentHTML = `
            <div class="category-hinos-view">
                <div class="view-header category-detail-header" style="background: ${category.color}20; border-left: 4px solid ${category.color}">
                    <div class="category-detail-info">
                        <button id="back-to-categories" class="icon-btn back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="category-title-icon">
                            <div class="category-detail-icon" style="color: ${category.color}">
                                <i class="${category.icon}"></i>
                            </div>
                            <div>
                                <h2>${category.name}</h2>
                                <p class="category-detail-description">${category.description}</p>
                            </div>
                        </div>
                        <div class="category-detail-stats">
                            <span><i class="fas fa-music"></i> ${categoryHinos.length} hinos</span>
                            <span><i class="fas fa-clock"></i> ${formatCategoryDuration(categoryHinos)} min</span>
                        </div>
                    </div>
                    
                    <div class="category-detail-actions">
                        <button id="play-category" class="btn-primary ${categoryHinos.length === 0 ? 'disabled' : ''}" 
                                ${categoryHinos.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-play-circle"></i> Reproduzir Todos
                        </button>
                        <button id="shuffle-category" class="btn-secondary ${categoryHinos.length === 0 ? 'disabled' : ''}" 
                                ${categoryHinos.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-random"></i> Embaralhar
                        </button>
                    </div>
                </div>
                
                ${categoryHinos.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-music"></i>
                        <h3>Nenhum hino nesta categoria</h3>
                        <p>A categoria "${category.name}" não contém hinos no momento.</p>
                    </div>
                ` : `
                    <div class="view-actions">
                        <button id="select-all-category" class="btn-secondary">
                            <i class="fas fa-check-square"></i> Selecionar Todos
                        </button>
                        <button id="add-to-playlist-category" class="btn-secondary">
                            <i class="fas fa-list"></i> Adicionar à Playlist
                        </button>
                    </div>
                    
                    <div class="category-hinos-list" id="category-hinos-list">
                        <!-- Hinos da categoria serão listados aqui -->
                    </div>
                `}
            </div>
        `;
        
        replaceMainContent(contentHTML);
        
        if (categoryHinos.length > 0) {
            renderCategoryHinosList(categoryHinos, categoryId);
        }
        
        addCategoryHinosEvents(categoryId);
    };
    
    const renderCategoryHinosList = (hinos, categoryId) => {
        const container = document.getElementById('category-hinos-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        let selectedHinos = new Set();
        
        hinos.forEach(hino => {
            const isCurrent = window.AppState?.currentHino?.id === hino.id;
            const isFavorite = window.FavoritesModule?.isFavorite(hino.id);
            
            const hinoItem = document.createElement('div');
            hinoItem.className = `hino-item ${isCurrent ? 'active' : ''}`;
            hinoItem.dataset.id = hino.id;
            
            hinoItem.innerHTML = `
                <div class="hino-info-main">
                    <div class="hino-selection-checkbox">
                        <input type="checkbox" id="cat-hino-${hino.id}">
                        <label for="cat-hino-${hino.id}"></label>
                    </div>
                    <div class="hino-number">${hino.numero}</div>
                    <div class="hino-details">
                        <div class="hino-title">${hino.titulo}</div>
                        <div class="hino-meta">
                            <span class="hino-duration">${formatTime(hino.duracao)}</span>
                        </div>
                    </div>
                </div>
                <div class="hino-actions">
                    <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                            title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn play-btn" title="Reproduzir">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(hinoItem);
        });
        
        addCategoryHinosListEvents(categoryId, selectedHinos);
    };
    
    const formatCategoryDuration = (hinos) => {
        const totalSeconds = hinos.reduce((sum, hino) => sum + (hino.duracao || 0), 0);
        const minutes = Math.floor(totalSeconds / 60);
        return minutes;
    };
    
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
        
        // Remover TODAS as views possíveis
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
        
        allViews.forEach(view => view.remove());
        
        // Adicionar nova view
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHTML;
        main.appendChild(tempDiv.firstElementChild);
    };
    
    // Event Handlers
    const addCategoriesEvents = () => {
        // Eventos dos cards de categoria
        document.querySelectorAll('.category-card').forEach(card => {
            const categoryId = card.dataset.id;
            
            // Reproduzir categoria
            card.querySelector('.category-play-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                playCategory(categoryId);
            });
            
            // Ver hinos da categoria
            card.querySelector('.category-view-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                renderCategoryHinosView(categoryId);
            });
            
            // Clicar no card (exceto nos botões)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions')) {
                    renderCategoryHinosView(categoryId);
                }
            });
        });
    };
    
    const addCategoryHinosEvents = (categoryId) => {
        // Voltar para categorias
        const backBtn = document.getElementById('back-to-categories');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                renderCategoriesView();
            });
        }
        
        // Reproduzir categoria
        const playBtn = document.getElementById('play-category');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                playCategory(categoryId);
            });
        }
        
        // Embaralhar categoria
        const shuffleBtn = document.getElementById('shuffle-category');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                const categoryHinos = getHinosByCategory(categoryId);
                if (categoryHinos.length === 0) return;
                
                const shuffled = [...categoryHinos].sort(() => Math.random() - 0.5);
                if (window.AppState) {
                    window.AppState.queue = shuffled;
                    
                    const firstHino = shuffled[0];
                    if (window.playHino) {
                        window.playHino(firstHino);
                        showToast('Categoria embaralhada', 'success');
                    }
                    
                    if (window.closeMenu) {
                        window.closeMenu();
                    }
                }
            });
        }
        
        // Selecionar todos
        const selectAllBtn = document.getElementById('select-all-category');
        if (selectAllBtn) {
            let allSelected = false;
            
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('#category-hinos-list input[type="checkbox"]');
                
                checkboxes.forEach(checkbox => {
                    checkbox.checked = !allSelected;
                });
                
                allSelected = !allSelected;
                selectAllBtn.innerHTML = allSelected ? 
                    '<i class="fas fa-times-square"></i> Desmarcar Todos' : 
                    '<i class="fas fa-check-square"></i> Selecionar Todos';
            });
        }
        
        // Adicionar à playlist
        const addToPlaylistBtn = document.getElementById('add-to-playlist-category');
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('#category-hinos-list input[type="checkbox"]:checked');
                if (checkboxes.length === 0) {
                    showToast('Selecione pelo menos um hino', 'info');
                    return;
                }
                
                const selectedHinoIds = Array.from(checkboxes).map(cb => {
                    const hinoId = parseInt(cb.id.replace('cat-hino-', ''));
                    return hinoId;
                });
                
                showAddToPlaylistModal(selectedHinoIds, categoryId);
            });
        }
    };
    
    const addCategoryHinosListEvents = (categoryId, selectedHinos) => {
        const container = document.getElementById('category-hinos-list');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const hinoItem = e.target.closest('.hino-item');
            if (!hinoItem) return;
            
            const hinoId = parseInt(hinoItem.dataset.id);
            const hino = window.AppState?.hinos?.find(h => h.id === hinoId);
            if (!hino) return;
            
            const actionBtn = e.target.closest('.action-btn');
            const checkbox = hinoItem.querySelector('input[type="checkbox"]');
            
            if (actionBtn) {
                if (actionBtn.classList.contains('favorite-btn')) {
                    // Toggle favorito
                    if (window.FavoritesModule) {
                        window.FavoritesModule.toggleFavorite(hinoId);
                        const heartIcon = actionBtn.querySelector('i');
                        const isFavorite = heartIcon.classList.contains('fas');
                        
                        if (isFavorite) {
                            actionBtn.classList.add('active');
                            actionBtn.title = 'Remover dos favoritos';
                            heartIcon.className = 'far fa-heart';
                        } else {
                            actionBtn.classList.remove('active');
                            actionBtn.title = 'Adicionar aos favoritos';
                            heartIcon.className = 'fas fa-heart';
                        }
                    }
                } else if (actionBtn.classList.contains('play-btn')) {
                    // Reproduzir
                    playHinoAndClose(hino);
                }
            } else if (checkbox && (e.target === checkbox || e.target === checkbox.nextElementSibling)) {
                // Lidar com o clique no checkbox (já tratado pelo navegador)
                return;
            } else {
                // Clicou no item - reproduzir
                playHinoAndClose(hino);
            }
        });
    };
    
    const playHinoAndClose = (hino) => {
        if (window.playHino) {
            window.playHino(hino);
        }
        if (window.closeMenu) {
            window.closeMenu();
        }
    };
    
    const showAddToPlaylistModal = (hinoIds, categoryId) => {
        if (!window.PlaylistsModule) {
            showToast('Módulo de playlists não disponível', 'error');
            return;
        }
        
        const userPlaylists = window.PlaylistsModule.getUserPlaylists();
        
        const modalHTML = `
            <div class="modal-overlay" id="add-to-playlist-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-list"></i> Adicionar à Playlist</h3>
                        <button class="modal-close" id="add-to-playlist-modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-content">
                        <p>Adicionar ${hinoIds.length} hino(s) selecionado(s):</p>
                        
                        ${userPlaylists.length === 0 ? `
                            <div class="empty-state" style="margin: var(--spacing-lg) 0; text-align: center;">
                                <i class="fas fa-inbox"></i>
                                <h4>Nenhuma playlist criada</h4>
                                <p>Crie uma playlist primeiro</p>
                            </div>
                        ` : `
                            <div class="playlists-selection-list" id="playlists-selection-list" style="margin-top: var(--spacing-md)">
                                ${userPlaylists.map(playlist => {
                                    // Contar quantos hinos já estão na playlist
                                    const alreadyInPlaylist = hinoIds.filter(id => 
                                        playlist.hinos.includes(id)
                                    ).length;
                                    
                                    return `
                                        <div class="playlist-selection-item" data-playlist-id="${playlist.id}">
                                            <div class="playlist-selection-info">
                                                <div class="playlist-selection-icon" style="color: ${playlist.color}">
                                                    <i class="${playlist.icon}"></i>
                                                </div>
                                                <div>
                                                    <h4>${playlist.name}</h4>
                                                    <p>${alreadyInPlaylist} dos ${hinoIds.length} hinos já estão aqui</p>
                                                </div>
                                            </div>
                                            <button class="btn-secondary btn-sm add-to-this-playlist">
                                                <i class="fas fa-plus"></i> Adicionar
                                            </button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancelar</button>
                        ${userPlaylists.length === 0 ? `
                            <button class="btn-primary" id="create-playlist-for-hinos">
                                <i class="fas fa-plus-circle"></i> Criar Nova Playlist
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupAddToPlaylistModal(hinoIds, categoryId);
    };
    
    const setupAddToPlaylistModal = (hinoIds, categoryId) => {
        const modal = document.getElementById('add-to-playlist-modal');
        if (!modal) return;
        
        // Fechar modal
        modal.querySelector('#add-to-playlist-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Adicionar à playlist específica
        modal.querySelectorAll('.add-to-this-playlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playlistItem = e.target.closest('.playlist-selection-item');
                const playlistId = playlistItem.dataset.playlistId;
                
                let addedCount = 0;
                hinoIds.forEach(hinoId => {
                    if (window.PlaylistsModule.addHinoToPlaylist(playlistId, hinoId)) {
                        addedCount++;
                    }
                });
                
                modal.remove();
                showToast(`${addedCount} hino(s) adicionado(s) à playlist`, 'success');
            });
        });
        
        // Criar nova playlist
        const createBtn = modal.querySelector('#create-playlist-for-hinos');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                modal.remove();
                
                // Abrir modal de criar playlist
                if (window.PlaylistsModule) {
                    window.PlaylistsModule.showCreatePlaylistModal();
                    
                    // Após criar a playlist, adicionar os hinos
                    const originalCreate = window.PlaylistsModule.createPlaylist;
                    window.PlaylistsModule.createPlaylist = function(name, description, color, icon) {
                        const newPlaylist = originalCreate.call(this, name, description, color, icon);
                        if (newPlaylist) {
                            hinoIds.forEach(hinoId => {
                                window.PlaylistsModule.addHinoToPlaylist(newPlaylist.id, hinoId);
                            });
                            showToast(`Playlist criada com ${hinoIds.length} hino(s)`, 'success');
                        }
                        window.PlaylistsModule.createPlaylist = originalCreate;
                        return newPlaylist;
                    };
                }
            });
        }
    };
    
    return {
        init,
        getAllCategories,
        getCategory,
        getHinosByCategory,
        getCategoryStats,
        playCategory,
        renderCategoriesView,
        renderCategoryHinosView
    };
})();

window.CategoriesModule = CategoriesModule;
console.log('Módulo Categorias carregado');
