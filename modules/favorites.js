// modules/favorites.js - Módulo de Gerenciamento de Favoritos (CORRIGIDO)

const FavoritesModule = (() => {
    let favorites = new Set();
    let isInitialized = false;
    
    const init = async () => {
        try {
            const savedFavorites = localStorage.getItem('hinosCCB_favorites');
            if (savedFavorites) {
                const favoritesArray = JSON.parse(savedFavorites);
                favorites = new Set(favoritesArray);
            }
            
            isInitialized = true;
            console.log('Módulo Favoritos inicializado. Total:', favorites.size);
            
            updateFavoritesCount();
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar módulo Favoritos:', error);
            return false;
        }
    };
    
    const toggleFavorite = (hinoId) => {
        if (!isInitialized) {
            console.warn('Módulo Favoritos não inicializado');
            return false;
        }
        
        const wasFavorite = favorites.has(hinoId);
        
        if (wasFavorite) {
            favorites.delete(hinoId);
            console.log('Removido dos favoritos:', hinoId);
            showToast('Removido dos favoritos', 'info');
        } else {
            favorites.add(hinoId);
            console.log('Adicionado aos favoritos:', hinoId);
            showToast('Adicionado aos favoritos', 'success');
        }
        
        saveToStorage();
        updateFavoritesCount();
        updateFavoriteButton(hinoId);
        
        return !wasFavorite;
    };
    
    const isFavorite = (hinoId) => {
        return favorites.has(hinoId);
    };
    
    const getAllFavorites = () => {
        return Array.from(favorites);
    };
    
    const getFavoriteHinos = () => {
        if (!window.AppState || !window.AppState.hinos) {
            return [];
        }
        
        return window.AppState.hinos.filter(hino => favorites.has(hino.id));
    };
    
    const getCount = () => {
        return favorites.size;
    };
    
    const clearAll = () => {
        if (favorites.size === 0) {
            showToast('Não há favoritos para remover', 'info');
            return false;
        }
        
        if (confirm(`Remover todos os ${favorites.size} favoritos?`)) {
            favorites.clear();
            saveToStorage();
            updateFavoritesCount();
            showToast('Todos os favoritos removidos', 'success');
            
            // Atualizar a view se estiver na view de favoritos
            if (window.AppState?.currentView === 'favorites') {
                renderFavoritesView();
            }
            
            return true;
        }
        
        return false;
    };
    
    const updateFavoriteButton = (hinoId = null) => {
        const currentHino = window.AppState?.currentHino;
        const favoriteBtn = window.elements?.favoriteBtn;
        
        if (!favoriteBtn || !currentHino) return;
        
        const checkId = hinoId || currentHino.id;
        const isFav = favorites.has(checkId);
        
        if (!hinoId || checkId === currentHino.id) {
            const icon = isFav ? 'fas fa-heart' : 'far fa-heart';
            const color = isFav ? 'style="color: #f44336;"' : '';
            
            favoriteBtn.innerHTML = `<i class="${icon}" ${color}></i>`;
            favoriteBtn.title = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        }
    };
    
    const updateFavoritesCount = () => {
        const favoritesCount = window.elements?.favoritesCount;
        if (favoritesCount) {
            favoritesCount.textContent = favorites.size;
        }
    };
    
    const saveToStorage = () => {
        try {
            localStorage.setItem('hinosCCB_favorites', JSON.stringify(Array.from(favorites)));
        } catch (error) {
            console.error('Erro ao salvar favoritos:', error);
        }
    };
    
    const playAllFavorites = () => {
        const favoriteHinos = getFavoriteHinos();
        
        if (favoriteHinos.length === 0) {
            showToast('Não há hinos favoritados para reproduzir', 'info');
            return;
        }
        
        if (window.AppState) {
            window.AppState.queue = [...favoriteHinos];
            console.log('Fila definida com', favoriteHinos.length, 'favoritos');
            
            const firstHino = favoriteHinos[0];
            if (window.playHino) {
                window.playHino(firstHino);
                showToast(`Reproduzindo ${favoriteHinos.length} favoritos`, 'success');
            }
            
            if (window.closeMenu) {
                window.closeMenu();
            }
        }
    };
    
    const renderFavoritesView = () => {
        const favoriteHinos = getFavoriteHinos();
        
        let contentHTML = `
            <div class="favorites-view">
                <div class="view-header">
                    <h2><i class="fas fa-heart" style="color: #f44336;"></i> Hinos Favoritos</h2>
                    <p class="view-subtitle">${favoriteHinos.length} hinos favoritados</p>
                </div>
                
                <div class="view-actions">
                    <button id="play-all-favorites" class="btn-primary" ${favoriteHinos.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-play-circle"></i> Reproduzir Todos
                    </button>
                    <button id="shuffle-favorites" class="btn-secondary" ${favoriteHinos.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-random"></i> Embaralhar
                    </button>
                    ${favoriteHinos.length > 0 ? `
                        <button id="clear-all-favorites" class="btn-danger">
                            <i class="fas fa-trash"></i> Limpar Todos
                        </button>
                    ` : ''}
                </div>
                
                ${favoriteHinos.length === 0 ? 
                    `<div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>Nenhum hino favoritado</h3>
                        <p>Adicione hinos aos favoritos clicando no coração enquanto um hino está tocando.</p>
                    </div>` : 
                    `<div class="hinos-list" id="favorites-list">
                        <!-- Hinos favoritos serão carregados aqui -->
                    </div>`
                }
            </div>
        `;
        
        replaceMainContent(contentHTML);
        
        if (favoriteHinos.length > 0) {
            renderFavoritesList(favoriteHinos);
        }
        
        addFavoritesActionsEvents();
    };
    
    const renderFavoritesList = (favoriteHinos) => {
        const container = document.getElementById('favorites-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        favoriteHinos.forEach(hino => {
            const isCurrent = window.AppState?.currentHino?.id === hino.id;
            
            const hinoItem = document.createElement('div');
            hinoItem.className = `hino-item ${isCurrent ? 'active' : ''}`;
            hinoItem.dataset.id = hino.id;
            
            hinoItem.innerHTML = `
                <div class="hino-info-main">
                    <div class="hino-number">${hino.numero}</div>
                    <div class="hino-details">
                        <div class="hino-title">${hino.titulo}</div>
                        <div class="hino-meta">
                            <span class="hino-duration">${formatTime(hino.duracao)}</span>
                        </div>
                    </div>
                </div>
                <div class="hino-actions">
                    <button class="action-btn favorite-btn active" title="Remover dos favoritos" data-action="toggle">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn play-btn" title="Reproduzir" data-action="play">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(hinoItem);
        });
        
        addFavoritesListEvents();
    };
    
    const addFavoritesListEvents = () => {
        const container = document.getElementById('favorites-list');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const hinoItem = e.target.closest('.hino-item');
            if (!hinoItem) return;
            
            const hinoId = parseInt(hinoItem.dataset.id);
            const hino = window.AppState?.hinos?.find(h => h.id === hinoId);
            if (!hino) return;
            
            const actionBtn = e.target.closest('.action-btn');
            if (!actionBtn) {
                // Clicou no item - reproduzir
                playHinoAndClose(hino);
                return;
            }
            
            const action = actionBtn.dataset.action;
            
            switch (action) {
                case 'toggle':
                    handleFavoriteToggle(hinoId, container, hinoItem);
                    break;
                    
                case 'play':
                    playHinoAndClose(hino);
                    break;
            }
        });
    };
    
    const handleFavoriteToggle = (hinoId, container, hinoItem) => {
        // Remover dos favoritos
        const wasRemoved = toggleFavorite(hinoId);
        
        if (wasRemoved) {
            hinoItem.remove();
            
            // Atualizar contador
            updateFavoritesCount();
            
            // Se a lista ficou vazia, recarregar view
            if (container.children.length === 0) {
                renderFavoritesView();
            }
        }
    };
    
    const playHinoAndClose = (hino) => {
        if (window.playHino) {
            window.playHino(hino);
        }
        if (window.closeMenu) {
            window.closeMenu();
        }
    };
    
    const addFavoritesActionsEvents = () => {
        // Reproduzir todos
        const playAllBtn = document.getElementById('play-all-favorites');
        if (playAllBtn) {
            playAllBtn.addEventListener('click', playAllFavorites);
        }
        
        // Embaralhar favoritos
        const shuffleBtn = document.getElementById('shuffle-favorites');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                const favoriteHinos = getFavoriteHinos();
                if (favoriteHinos.length === 0) return;
                
                const shuffled = [...favoriteHinos].sort(() => Math.random() - 0.5);
                
                if (window.AppState) {
                    window.AppState.queue = shuffled;
                    
                    if (window.playHino) {
                        window.playHino(shuffled[0]);
                        showToast('Favoritos embaralhados', 'success');
                    }
                }
            });
        }
        
        // Limpar todos
        const clearAllBtn = document.getElementById('clear-all-favorites');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                clearAll();
            });
        }
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
        
        // Remover outras views
        const views = main.querySelectorAll('.library-view, .favorites-view, .playlists-view, .history-view, .settings-view');
        views.forEach(view => view.remove());
        
        // Adicionar nova view
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHTML;
        main.appendChild(tempDiv.firstElementChild);
    };
    
    return {
        init,
        toggleFavorite,
        isFavorite,
        getAllFavorites,
        getFavoriteHinos,
        getCount,
        clearAll,
        updateFavoriteButton,
        playAllFavorites,
        renderFavoritesView
    };
})();

window.FavoritesModule = FavoritesModule;
console.log('Módulo Favorites carregado');