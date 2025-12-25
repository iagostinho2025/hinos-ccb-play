// modules/playlists.js - Módulo de Gerenciamento de Playlists (CORRIGIDO)

const PlaylistsModule = (() => {
    let playlists = [];
    let isInitialized = false;
    const STORAGE_KEY = 'hinosCCB_playlists';
    
    const init = async () => {
        try {
            const savedPlaylists = localStorage.getItem(STORAGE_KEY);
            if (savedPlaylists) {
                playlists = JSON.parse(savedPlaylists);
            } else {
                // Playlists padrão
                playlists = [
                    {
                        id: 'default_favorites',
                        name: 'Favoritos',
                        description: 'Hinos favoritados automaticamente',
                        icon: 'fas fa-heart',
                        color: '#f44336',
                        isDefault: true,
                        hinos: []
                    },
                    {
                        id: 'recently_played',
                        name: 'Tocados Recentemente',
                        description: 'Histórico de reprodução',
                        icon: 'fas fa-history',
                        color: '#2196F3',
                        isDefault: true,
                        hinos: []
                    }
                ];
                saveToStorage();
            }
            
            isInitialized = true;
            console.log('Módulo Playlists inicializado. Total:', playlists.length);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar módulo Playlists:', error);
            return false;
        }
    };
    
    const createPlaylist = (name, description = '', color = '#4CAF50', icon = 'fas fa-list') => {
        if (!isInitialized) {
            console.warn('Módulo Playlists não inicializado');
            return null;
        }
        
        const id = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPlaylist = {
            id,
            name,
            description,
            icon,
            color,
            isDefault: false,
            hinos: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        playlists.push(newPlaylist);
        saveToStorage();
        
        console.log('Playlist criada:', newPlaylist);
        showToast(`Playlist "${name}" criada com sucesso!`, 'success');
        
        return newPlaylist;
    };
    
    const deletePlaylist = (playlistId) => {
        if (!isInitialized) return false;
        
        const index = playlists.findIndex(p => p.id === playlistId);
        if (index === -1) return false;
        
        // Não permitir deletar playlists padrão
        if (playlists[index].isDefault) {
            showToast('Playlists padrão não podem ser deletadas', 'error');
            return false;
        }
        
        const deletedName = playlists[index].name;
        playlists.splice(index, 1);
        saveToStorage();
        
        showToast(`Playlist "${deletedName}" deletada`, 'success');
        return true;
    };
    
    const addHinoToPlaylist = (playlistId, hinoId) => {
        if (!isInitialized) return false;
        
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        // Verificar se o hino já está na playlist
        if (playlist.hinos.includes(hinoId)) {
            showToast('Hino já está na playlist', 'info');
            return false;
        }
        
        playlist.hinos.push(hinoId);
        playlist.updatedAt = Date.now();
        saveToStorage();
        
        console.log(`Hino ${hinoId} adicionado à playlist ${playlist.name}`);
        showToast('Hino adicionado à playlist', 'success');
        return true;
    };
    
    const removeHinoFromPlaylist = (playlistId, hinoId) => {
        if (!isInitialized) return false;
        
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        const index = playlist.hinos.indexOf(hinoId);
        if (index === -1) return false;
        
        playlist.hinos.splice(index, 1);
        playlist.updatedAt = Date.now();
        saveToStorage();
        
        showToast('Hino removido da playlist', 'success');
        return true;
    };
    
    const getPlaylistHinos = (playlistId) => {
        if (!isInitialized || !window.AppState?.hinos) return [];
        
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return [];
        
        return window.AppState.hinos.filter(hino => playlist.hinos.includes(hino.id));
    };
    
    const getAllPlaylists = () => {
        return [...playlists];
    };
    
    const getUserPlaylists = () => {
        return playlists.filter(p => !p.isDefault);
    };
    
    const getPlaylist = (playlistId) => {
        return playlists.find(p => p.id === playlistId);
    };
    
    const updatePlaylist = (playlistId, updates) => {
        if (!isInitialized) return false;
        
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        // Não permitir atualizar playlists padrão
        if (playlist.isDefault && (updates.name || updates.icon || updates.color)) {
            showToast('Playlists padrão não podem ser modificadas', 'error');
            return false;
        }
        
        Object.assign(playlist, updates);
        playlist.updatedAt = Date.now();
        saveToStorage();
        
        showToast('Playlist atualizada', 'success');
        return true;
    };
    
    const saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
        } catch (error) {
            console.error('Erro ao salvar playlists:', error);
        }
    };
    
    const addToRecentlyPlayed = (hinoId) => {
        if (!isInitialized) return;
        
        const recentPlaylist = playlists.find(p => p.id === 'recently_played');
        if (!recentPlaylist) return;
        
        // Remover se já existir (para manter no topo)
        const index = recentPlaylist.hinos.indexOf(hinoId);
        if (index !== -1) {
            recentPlaylist.hinos.splice(index, 1);
        }
        
        // Adicionar no início
        recentPlaylist.hinos.unshift(hinoId);
        
        // Manter apenas os últimos 50
        if (recentPlaylist.hinos.length > 50) {
            recentPlaylist.hinos = recentPlaylist.hinos.slice(0, 50);
        }
        
        recentPlaylist.updatedAt = Date.now();
        saveToStorage();
    };
    
    const updateFavoritesPlaylist = () => {
        if (!isInitialized || !window.FavoritesModule) return;
        
        const favoritesPlaylist = playlists.find(p => p.id === 'default_favorites');
        if (!favoritesPlaylist) return;
        
        const favoriteHinos = window.FavoritesModule.getAllFavorites();
        favoritesPlaylist.hinos = favoriteHinos;
        favoritesPlaylist.updatedAt = Date.now();
        saveToStorage();
    };
    
    const playPlaylist = (playlistId) => {
        if (!isInitialized) return false;
        
        const playlistHinos = getPlaylistHinos(playlistId);
        if (playlistHinos.length === 0) {
            showToast('Playlist vazia', 'info');
            return false;
        }
        
        if (window.AppState) {
            window.AppState.queue = [...playlistHinos];
            
            const firstHino = playlistHinos[0];
            if (window.playHino) {
                window.playHino(firstHino);
                showToast(`Reproduzindo "${getPlaylist(playlistId)?.name}" (${playlistHinos.length} hinos)`, 'success');
            }
            
            if (window.closeMenu) {
                window.closeMenu();
            }
        }
        
        return true;
    };
    
    const renderPlaylistsView = () => {
        const userPlaylists = getUserPlaylists();
        
        let contentHTML = `
            <div class="playlists-view">
                <div class="view-header">
                    <h2><i class="fas fa-list"></i> Playlists</h2>
                    <p class="view-subtitle">${userPlaylists.length} playlists criadas</p>
                </div>
                
                <div class="view-actions">
                    <button id="create-playlist-btn" class="btn-primary">
                        <i class="fas fa-plus-circle"></i> Nova Playlist
                    </button>
                </div>
                
                ${userPlaylists.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-list-alt"></i>
                        <h3>Nenhuma playlist criada</h3>
                        <p>Crie sua primeira playlist para organizar seus hinos favoritos.</p>
                    </div>
                ` : `
                    <div class="playlists-grid" id="playlists-grid">
                        <!-- Playlists do usuário -->
                    </div>
                    
                    <div class="section-divider">
                        <h3><i class="fas fa-star"></i> Playlists do Sistema</h3>
                    </div>
                    
                    <div class="system-playlists" id="system-playlists">
                        <!-- Playlists padrão -->
                    </div>
                `}
            </div>
        `;
        
        replaceMainContent(contentHTML);
        
        if (userPlaylists.length > 0) {
            renderUserPlaylists(userPlaylists);
        }
        
        renderSystemPlaylists();
        addPlaylistsActionsEvents();
    };
    
    const renderUserPlaylists = (userPlaylists) => {
        const container = document.getElementById('playlists-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        userPlaylists.forEach(playlist => {
            const playlistHinos = getPlaylistHinos(playlist.id);
            
            const playlistCard = document.createElement('div');
            playlistCard.className = 'playlist-card';
            playlistCard.dataset.id = playlist.id;
            
            playlistCard.innerHTML = `
                <div class="playlist-header" style="background: ${playlist.color}20; border-left: 4px solid ${playlist.color}">
                    <div class="playlist-icon" style="color: ${playlist.color}">
                        <i class="${playlist.icon}"></i>
                    </div>
                    <div class="playlist-info">
                        <h3 class="playlist-title">${playlist.name}</h3>
                        <p class="playlist-stats">${playlistHinos.length} hinos</p>
                    </div>
                    <div class="playlist-actions">
                        <button class="icon-btn playlist-play-btn" title="Reproduzir">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="icon-btn playlist-edit-btn" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                ${playlist.description ? `
                    <div class="playlist-description">
                        <p>${playlist.description}</p>
                    </div>
                ` : ''}
                <div class="playlist-footer">
                    <button class="btn-text view-playlist-btn">
                        <i class="fas fa-eye"></i> Ver Hinos
                    </button>
                    <span class="playlist-date">
                        ${formatDate(playlist.updatedAt)}
                    </span>
                </div>
            `;
            
            container.appendChild(playlistCard);
        });
        
        addPlaylistCardEvents();
    };
    
    const renderSystemPlaylists = () => {
        const container = document.getElementById('system-playlists');
        if (!container) return;
        
        const systemPlaylists = playlists.filter(p => p.isDefault);
        
        container.innerHTML = '';
        
        systemPlaylists.forEach(playlist => {
            const playlistHinos = getPlaylistHinos(playlist.id);
            
            const playlistItem = document.createElement('div');
            playlistItem.className = 'system-playlist-item';
            playlistItem.dataset.id = playlist.id;
            
            playlistItem.innerHTML = `
                <div class="system-playlist-icon" style="color: ${playlist.color}">
                    <i class="${playlist.icon}"></i>
                </div>
                <div class="system-playlist-info">
                    <h4>${playlist.name}</h4>
                    <p>${playlist.description}</p>
                    <div class="system-playlist-stats">
                        <span>${playlistHinos.length} hinos</span>
                        <span>•</span>
                        <span>Atualizado: ${formatDate(playlist.updatedAt)}</span>
                    </div>
                </div>
                <div class="system-playlist-actions">
                    <button class="btn-secondary btn-sm system-play-btn">
                        <i class="fas fa-play"></i> Reproduzir
                    </button>
                    <button class="btn-text btn-sm view-system-playlist-btn">
                        Ver Hinos
                    </button>
                </div>
            `;
            
            container.appendChild(playlistItem);
        });
        
        addSystemPlaylistEvents();
    };
    
    const renderPlaylistDetailView = (playlistId) => {
        const playlist = getPlaylist(playlistId);
        if (!playlist) return;
        
        const playlistHinos = getPlaylistHinos(playlistId);
        
        let contentHTML = `
            <div class="playlist-detail-view">
                <div class="view-header playlist-detail-header" style="background: ${playlist.color}20; border-left: 4px solid ${playlist.color}">
                    <div class="playlist-detail-info">
                        <button id="back-to-playlists" class="icon-btn back-btn">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="playlist-title-icon">
                            <div class="playlist-detail-icon" style="color: ${playlist.color}">
                                <i class="${playlist.icon}"></i>
                            </div>
                            <div>
                                <h2>${playlist.name}</h2>
                                <p class="playlist-detail-description">${playlist.description || 'Sem descrição'}</p>
                            </div>
                        </div>
                        <div class="playlist-detail-stats">
                            <span><i class="fas fa-music"></i> ${playlistHinos.length} hinos</span>
                            <span><i class="fas fa-calendar-alt"></i> Criado: ${formatDate(playlist.createdAt)}</span>
                        </div>
                    </div>
                    
                    <div class="playlist-detail-actions">
                        <button id="play-playlist" class="btn-primary ${playlistHinos.length === 0 ? 'disabled' : ''}" 
                                ${playlistHinos.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-play-circle"></i> Reproduzir
                        </button>
                        ${!playlist.isDefault ? `
                            <button id="edit-playlist" class="btn-secondary">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button id="delete-playlist" class="btn-danger">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${playlistHinos.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-music"></i>
                        <h3>Playlist vazia</h3>
                        <p>Adicione hinos a esta playlist para começar.</p>
                    </div>
                ` : `
                    <div class="view-actions">
                        <button id="shuffle-playlist" class="btn-secondary">
                            <i class="fas fa-random"></i> Embaralhar
                        </button>
                        <button id="add-hinos-to-playlist" class="btn-secondary">
                            <i class="fas fa-plus"></i> Adicionar Hinos
                        </button>
                        ${!playlist.isDefault ? `
                            <button id="clear-playlist" class="btn-danger">
                                <i class="fas fa-broom"></i> Limpar Playlist
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="playlist-hinos-list" id="playlist-hinos-list">
                        <!-- Hinos da playlist serão listados aqui -->
                    </div>
                `}
            </div>
        `;
        
        replaceMainContent(contentHTML);
        
        if (playlistHinos.length > 0) {
            renderPlaylistHinosList(playlistHinos, playlistId);
        }
        
        addPlaylistDetailEvents(playlistId);
    };
    
    const renderPlaylistHinosList = (hinos, playlistId) => {
        const container = document.getElementById('playlist-hinos-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        hinos.forEach((hino, index) => {
            const isCurrent = window.AppState?.currentHino?.id === hino.id;
            const isFavorite = window.FavoritesModule?.isFavorite(hino.id);
            
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
                    ${!getPlaylist(playlistId)?.isDefault ? `
                        <button class="action-btn remove-from-playlist-btn" title="Remover da playlist">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
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
        
        addPlaylistHinosListEvents(playlistId);
    };
    
    const showCreatePlaylistModal = () => {
        const modalHTML = `
            <div class="modal-overlay" id="create-playlist-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus-circle"></i> Criar Nova Playlist</h3>
                        <button class="modal-close" id="modal-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label for="playlist-name"><i class="fas fa-heading"></i> Nome da Playlist</label>
                            <input type="text" id="playlist-name" placeholder="Ex: Adoração, Louvor, etc.">
                        </div>
                        <div class="form-group">
                            <label for="playlist-description"><i class="fas fa-align-left"></i> Descrição (opcional)</label>
                            <textarea id="playlist-description" rows="3" placeholder="Descreva sua playlist..."></textarea>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-palette"></i> Cor da Playlist</label>
                            <div class="color-picker" id="color-picker">
                                ${['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#607D8B'].map((color, index) => `
                                    <label class="color-option ${index === 0 ? 'selected' : ''}" style="background: ${color}">
                                        <input type="radio" name="playlist-color" value="${color}" ${index === 0 ? 'checked' : ''}>
                                        <i class="fas fa-check"></i>
                                    </label>
                                `).join('')}
                            </div>
                            
                            <label><i class="fas fa-icons"></i> Ícone da Playlist</label>
                            <div class="icon-picker" id="icon-picker">
                                ${['fa-list', 'fa-music', 'fa-heart', 'fa-star', 'fa-book', 'fa-gem', 'fa-crown', 'fa-fire'].map((icon, index) => `
                                    <label class="icon-option ${index === 0 ? 'selected' : ''}">
                                        <input type="radio" name="playlist-icon" value="fas ${icon}" ${index === 0 ? 'checked' : ''}>
                                        <i class="fas ${icon}"></i>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancelar</button>
                        <button class="btn-primary modal-confirm" id="create-playlist-confirm">Criar Playlist</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupCreatePlaylistModal();
    };
    
    const setupCreatePlaylistModal = () => {
        const modal = document.getElementById('create-playlist-modal');
        if (!modal) return;
        
        // Configurar eventos dos radio buttons de cor
        const colorOptions = modal.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.addEventListener('click', () => {
                // Remover seleção de todas
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // Selecionar esta
                option.classList.add('selected');
                radio.checked = true;
            });
        });
        
        // Configurar eventos dos radio buttons de ícone
        const iconOptions = modal.querySelectorAll('.icon-option');
        iconOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.addEventListener('click', () => {
                // Remover seleção de todas
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                // Selecionar esta
                option.classList.add('selected');
                radio.checked = true;
            });
        });
        
        // Eventos do modal
        modal.querySelector('#modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        // Fechar ao clicar no overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Evento para criar playlist
        modal.querySelector('#create-playlist-confirm').addEventListener('click', () => {
            const nameInput = modal.querySelector('#playlist-name');
            const descInput = modal.querySelector('#playlist-description');
            const colorRadio = modal.querySelector('input[name="playlist-color"]:checked');
            const iconRadio = modal.querySelector('input[name="playlist-icon"]:checked');
            
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            const color = colorRadio ? colorRadio.value : '#4CAF50';
            const icon = iconRadio ? iconRadio.value : 'fas fa-list';
            
            if (!name) {
                showToast('Digite um nome para a playlist', 'error');
                nameInput.focus();
                return;
            }
            
            // Criar a playlist
            createPlaylist(name, description, color, icon);
            
            // Fechar modal
            modal.remove();
            
            // Recarregar a view de playlists
            renderPlaylistsView();
        });
        
        // Focar no input do nome
        setTimeout(() => {
            modal.querySelector('#playlist-name').focus();
        }, 100);
    };
    
    const showEditPlaylistModal = (playlistId) => {
        const playlist = getPlaylist(playlistId);
        if (!playlist || playlist.isDefault) return;
        
        const modalHTML = `
            <div class="modal-overlay" id="edit-playlist-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Editar Playlist</h3>
                        <button class="modal-close" id="edit-modal-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-content">
                        <div class="form-group">
                            <label for="edit-playlist-name"><i class="fas fa-heading"></i> Nome da Playlist</label>
                            <input type="text" id="edit-playlist-name" value="${playlist.name}">
                        </div>
                        <div class="form-group">
                            <label for="edit-playlist-description"><i class="fas fa-align-left"></i> Descrição</label>
                            <textarea id="edit-playlist-description" rows="3">${playlist.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-palette"></i> Cor da Playlist</label>
                            <div class="color-picker" id="edit-color-picker">
                                ${['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#607D8B'].map(color => `
                                    <label class="color-option ${color === playlist.color ? 'selected' : ''}" style="background: ${color}">
                                        <input type="radio" name="edit-playlist-color" value="${color}" ${color === playlist.color ? 'checked' : ''}>
                                        <i class="fas fa-check"></i>
                                    </label>
                                `).join('')}
                            </div>
                            
                            <label><i class="fas fa-icons"></i> Ícone da Playlist</label>
                            <div class="icon-picker" id="edit-icon-picker">
                                ${['fa-list', 'fa-music', 'fa-heart', 'fa-star', 'fa-book', 'fa-gem', 'fa-crown', 'fa-fire'].map(icon => {
                                    const fullIcon = `fas ${icon}`;
                                    return `
                                        <label class="icon-option ${fullIcon === playlist.icon ? 'selected' : ''}">
                                            <input type="radio" name="edit-playlist-icon" value="${fullIcon}" ${fullIcon === playlist.icon ? 'checked' : ''}>
                                            <i class="${fullIcon}"></i>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancelar</button>
                        <button class="btn-primary modal-confirm" id="edit-playlist-confirm">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupEditPlaylistModal(playlistId);
    };
    
    const setupEditPlaylistModal = (playlistId) => {
        const modal = document.getElementById('edit-playlist-modal');
        if (!modal) return;
        
        const playlist = getPlaylist(playlistId);
        if (!playlist) return;
        
        // Configurar eventos dos radio buttons de cor
        const colorOptions = modal.querySelectorAll('#edit-color-picker .color-option');
        colorOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.addEventListener('click', () => {
                // Remover seleção de todas
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // Selecionar esta
                option.classList.add('selected');
                radio.checked = true;
            });
        });
        
        // Configurar eventos dos radio buttons de ícone
        const iconOptions = modal.querySelectorAll('#edit-icon-picker .icon-option');
        iconOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.addEventListener('click', () => {
                // Remover seleção de todas
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                // Selecionar esta
                option.classList.add('selected');
                radio.checked = true;
            });
        });
        
        // Eventos do modal
        modal.querySelector('#edit-modal-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        // Fechar ao clicar no overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Evento para salvar alterações
        modal.querySelector('#edit-playlist-confirm').addEventListener('click', () => {
            const nameInput = modal.querySelector('#edit-playlist-name');
            const descInput = modal.querySelector('#edit-playlist-description');
            const colorRadio = modal.querySelector('input[name="edit-playlist-color"]:checked');
            const iconRadio = modal.querySelector('input[name="edit-playlist-icon"]:checked');
            
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            const color = colorRadio ? colorRadio.value : playlist.color;
            const icon = iconRadio ? iconRadio.value : playlist.icon;
            
            if (!name) {
                showToast('Digite um nome para a playlist', 'error');
                nameInput.focus();
                return;
            }
            
            // Atualizar a playlist
            updatePlaylist(playlistId, { name, description, color, icon });
            
            // Fechar modal
            modal.remove();
            
            // Recarregar a view atual
            renderPlaylistDetailView(playlistId);
        });
        
        // Focar no input do nome
        setTimeout(() => {
            modal.querySelector('#edit-playlist-name').focus();
        }, 100);
    };
    
    const showAddHinosModal = (playlistId) => {
        if (!window.AppState?.hinos) return;
        
        const modalHTML = `
            <div class="modal-overlay" id="add-hinos-modal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus"></i> Adicionar Hinos à Playlist</h3>
                        <button class="modal-close" id="add-hinos-modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-content">
                        <div class="search-container" style="margin-bottom: var(--spacing-md)">
                            <input type="text" id="modal-hino-search" placeholder="Buscar hinos...">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="hinos-selection-list" id="hinos-selection-list" style="max-height: 300px; overflow-y: auto">
                            <!-- Lista de hinos para selecionar -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="selection-info" id="selected-count">0 hinos selecionados</div>
                        <div class="modal-actions">
                            <button class="btn-secondary modal-cancel">Cancelar</button>
                            <button class="btn-primary modal-confirm" id="add-hinos-confirm">Adicionar Selecionados</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupAddHinosModal(playlistId);
    };
    
    const setupAddHinosModal = (playlistId) => {
        const modal = document.getElementById('add-hinos-modal');
        if (!modal) return;
        
        const playlist = getPlaylist(playlistId);
        if (!playlist) return;
        
        let selectedHinos = new Set();
        
        const renderSelectionList = () => {
            const container = document.getElementById('hinos-selection-list');
            if (!container) return;
            
            container.innerHTML = '';
            
            window.AppState.hinos.forEach(hino => {
                const alreadyInPlaylist = playlist.hinos.includes(hino.id);
                const isSelected = selectedHinos.has(hino.id);
                
                const hinoItem = document.createElement('div');
                hinoItem.className = `hino-selection-item ${alreadyInPlaylist ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
                hinoItem.dataset.id = hino.id;
                
                if (alreadyInPlaylist) {
                    hinoItem.innerHTML = `
                        <div class="hino-selection-info">
                            <div class="hino-number">${hino.numero}</div>
                            <div class="hino-details">
                                <div class="hino-title">${hino.titulo}</div>
                                <div class="hino-meta">
                                    <span class="hino-duration">${formatTime(hino.duracao)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="hino-selection-status">
                            <span class="already-added"><i class="fas fa-check"></i> Já na playlist</span>
                        </div>
                    `;
                } else {
                    hinoItem.innerHTML = `
                        <div class="hino-selection-info">
                            <div class="hino-number">${hino.numero}</div>
                            <div class="hino-details">
                                <div class="hino-title">${hino.titulo}</div>
                                <div class="hino-meta">
                                    <span class="hino-duration">${formatTime(hino.duracao)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="hino-selection-checkbox">
                            <input type="checkbox" id="hino-${hino.id}" ${isSelected ? 'checked' : ''}>
                            <label for="hino-${hino.id}"></label>
                        </div>
                    `;
                }
                
                container.appendChild(hinoItem);
            });
            
            updateSelectionCount();
        };
        
        const updateSelectionCount = () => {
            const countElement = document.getElementById('selected-count');
            if (countElement) {
                countElement.textContent = `${selectedHinos.size} hinos selecionados`;
            }
        };
        
        renderSelectionList();
        
        // Eventos do modal
        modal.querySelector('#add-hinos-modal-close').addEventListener('click', () => {
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
        
        // Busca
        const searchInput = modal.querySelector('#modal-hino-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterSelectionList(query);
            });
        }
        
        // Seleção de hinos
        const container = document.getElementById('hinos-selection-list');
        container.addEventListener('click', (e) => {
            const hinoItem = e.target.closest('.hino-selection-item:not(.disabled)');
            if (!hinoItem) return;
            
            const hinoId = parseInt(hinoItem.dataset.id);
            const checkbox = hinoItem.querySelector('input[type="checkbox"]');
            
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                
                if (checkbox.checked) {
                    selectedHinos.add(hinoId);
                    hinoItem.classList.add('selected');
                } else {
                    selectedHinos.delete(hinoId);
                    hinoItem.classList.remove('selected');
                }
                
                updateSelectionCount();
            }
        });
        
        modal.querySelector('#add-hinos-confirm').addEventListener('click', () => {
            if (selectedHinos.size === 0) {
                showToast('Selecione pelo menos um hino', 'info');
                return;
            }
            
            selectedHinos.forEach(hinoId => {
                addHinoToPlaylist(playlistId, hinoId);
            });
            
            modal.remove();
            renderPlaylistDetailView(playlistId);
        });
    };
    
    const filterSelectionList = (query) => {
        const container = document.getElementById('hinos-selection-list');
        if (!container) return;
        
        const items = container.querySelectorAll('.hino-selection-item');
        items.forEach(item => {
            const hinoNumber = item.querySelector('.hino-number').textContent;
            const hinoTitle = item.querySelector('.hino-title').textContent.toLowerCase();
            
            if (query === '' || hinoNumber.includes(query) || hinoTitle.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    };
    
    // Event Handlers
const addPlaylistsActionsEvents = () => {
    // Criar playlist
    const createBtn = document.getElementById('create-playlist-btn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreatePlaylistModal);
    }
};
    
    const addPlaylistCardEvents = () => {
        document.querySelectorAll('.playlist-card').forEach(card => {
            const playlistId = card.dataset.id;
            
            // Ver hinos
            card.querySelector('.view-playlist-btn')?.addEventListener('click', () => {
                renderPlaylistDetailView(playlistId);
            });
            
            // Reproduzir playlist
            card.querySelector('.playlist-play-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                playPlaylist(playlistId);
            });
            
            // Editar playlist
            card.querySelector('.playlist-edit-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                showEditPlaylistModal(playlistId);
            });
            
            // Clicar no card (exceto nos botões)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.playlist-actions')) {
                    renderPlaylistDetailView(playlistId);
                }
            });
        });
    };
    
    const addSystemPlaylistEvents = () => {
        document.querySelectorAll('.system-playlist-item').forEach(item => {
            const playlistId = item.dataset.id;
            
            // Reproduzir
            item.querySelector('.system-play-btn')?.addEventListener('click', () => {
                playPlaylist(playlistId);
            });
            
            // Ver hinos
            item.querySelector('.view-system-playlist-btn')?.addEventListener('click', () => {
                renderPlaylistDetailView(playlistId);
            });
        });
    };
    
    const addPlaylistDetailEvents = (playlistId) => {
        // Voltar para playlists
        const backBtn = document.getElementById('back-to-playlists');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                renderPlaylistsView();
            });
        }
        
        // Reproduzir playlist
        const playBtn = document.getElementById('play-playlist');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                playPlaylist(playlistId);
            });
        }
        
        // Editar playlist
        const editBtn = document.getElementById('edit-playlist');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showEditPlaylistModal(playlistId);
            });
        }
        
        // Excluir playlist
        const deleteBtn = document.getElementById('delete-playlist');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja excluir esta playlist?')) {
                    if (deletePlaylist(playlistId)) {
                        renderPlaylistsView();
                    }
                }
            });
        }
        
        // Embaralhar playlist
        const shuffleBtn = document.getElementById('shuffle-playlist');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                const playlistHinos = getPlaylistHinos(playlistId);
                if (playlistHinos.length === 0) return;
                
                const shuffled = [...playlistHinos].sort(() => Math.random() - 0.5);
                if (window.AppState) {
                    window.AppState.queue = shuffled;
                    
                    const firstHino = shuffled[0];
                    if (window.playHino) {
                        window.playHino(firstHino);
                        showToast('Playlist embaralhada', 'success');
                    }
                    
                    if (window.closeMenu) {
                        window.closeMenu();
                    }
                }
            });
        }
        
        // Adicionar hinos
        const addHinosBtn = document.getElementById('add-hinos-to-playlist');
        if (addHinosBtn) {
            addHinosBtn.addEventListener('click', () => {
                showAddHinosModal(playlistId);
            });
        }
        
        // Limpar playlist
        const clearBtn = document.getElementById('clear-playlist');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const playlist = getPlaylist(playlistId);
                if (!playlist || playlist.hinos.length === 0) return;
                
                if (confirm(`Limpar todos os ${playlist.hinos.length} hinos desta playlist?`)) {
                    playlist.hinos = [];
                    playlist.updatedAt = Date.now();
                    saveToStorage();
                    
                    showToast('Playlist limpa', 'success');
                    renderPlaylistDetailView(playlistId);
                }
            });
        }
    };
    
    const addPlaylistHinosListEvents = (playlistId) => {
        const container = document.getElementById('playlist-hinos-list');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const hinoItem = e.target.closest('.hino-item');
            if (!hinoItem) return;
            
            const hinoId = parseInt(hinoItem.dataset.id);
            const hino = window.AppState?.hinos?.find(h => h.id === hinoId);
            if (!hino) return;
            
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                if (actionBtn.classList.contains('remove-from-playlist-btn')) {
                    // Remover da playlist
                    removeHinoFromPlaylist(playlistId, hinoId);
                    renderPlaylistDetailView(playlistId);
                } else if (actionBtn.classList.contains('favorite-btn')) {
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
            } else {
                // Clicou no item - reproduzir
                playHinoAndClose(hino);
            }
        });
    };
    
    const playHinoAndClose = (hino) => {
        if (window.playHino) {
            window.playHino(hino);
            // Adicionar ao histórico de reprodução
            addToRecentlyPlayed(hino.id);
        }
        if (window.closeMenu) {
            window.closeMenu();
        }
    };
    
    // Funções auxiliares
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Se for hoje
        if (date.toDateString() === now.toDateString()) {
            return 'Hoje';
        }
        
        // Se for ontem
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        }
        
        // Se for na última semana
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return days[date.getDay()];
        }
        
        // Mais de uma semana
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
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
        const views = main.querySelectorAll('.library-view, .favorites-view, .playlists-view, .history-view, .settings-view, .playlist-detail-view');
        views.forEach(view => view.remove());
        
        // Adicionar nova view
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHTML;
        main.appendChild(tempDiv.firstElementChild);
    };
    
    // Integração com outros módulos
    const setupIntegration = () => {
        if (window.FavoritesModule) {
            // Observar mudanças nos favoritos
            const originalToggle = window.FavoritesModule.toggleFavorite;
            window.FavoritesModule.toggleFavorite = function(hinoId) {
                const result = originalToggle.call(this, hinoId);
                updateFavoritesPlaylist();
                return result;
            };
        }
    };
    
    // Inicializar integração
    setTimeout(setupIntegration, 1000);
    
    return {
        init,
        createPlaylist,
        deletePlaylist,
        addHinoToPlaylist,
        removeHinoFromPlaylist,
        getPlaylistHinos,
        getAllPlaylists,
        getUserPlaylists,
        getPlaylist,
        updatePlaylist,
        playPlaylist,
        addToRecentlyPlayed,
        renderPlaylistsView,
        renderPlaylistDetailView,
        showCreatePlaylistModal,
        showEditPlaylistModal,
        showAddHinosModal
    };
})();

window.PlaylistsModule = PlaylistsModule;
console.log('Módulo Playlists carregado');