// app.js - Hinos CCB Play - CORE MODULAR
// VERSÃO FINAL CORRIGIDA (Com Filtro de Hinos Vazios)

// ===== CONFIGURAÇÃO GLOBAL DO APP =====
const AppState = {
    currentHino: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    repeatMode: 'none',
    shuffleMode: false,
    currentTab: 'player',
    currentView: 'player',
    
    hinos: [],
    queue: [],
    
    settings: {
        darkMode: true,
        autoPlayNext: true,
        showLyrics: true
    }
};

// ===== ELEMENTOS DOM GLOBAIS =====
let elements = {
    app: document.getElementById('app'),
    loadingScreen: document.getElementById('loading-screen'),
    menuToggle: document.getElementById('menu-toggle'),
    searchToggle: document.getElementById('search-toggle'),
    currentHinoHeader: document.getElementById('current-hino-header'),
    sideMenu: document.getElementById('side-menu'),
    menuClose: document.getElementById('menu-close'),
    menuOverlay: document.getElementById('menu-overlay'),
    menuSearch: document.getElementById('menu-search'),
    favoritesCount: document.getElementById('favorites-count'),
    audioPlayer: document.getElementById('audio-player'),
    toastContainer: document.getElementById('toast-container'),
    // Elementos do Player
    playBtn: null,
    prevBtn: null,
    nextBtn: null,
    repeatBtn: null,
    shuffleBtn: null,
    favoriteBtn: null,
    progressSlider: null,
    // Novos Elementos
    volumeSlider: null,
    volumeBtn: null,
    playlistAddBtn: null
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Hinos CCB Play - Inicializando...');
    try {
        await loadInitialData();
        await initModules();
        initAudioPlayer();
        initCoreUI();
        initCoreEvents();
        
        // Remove tela de carregamento
        setTimeout(() => {
            if(elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
            if(elements.app) elements.app.classList.remove('hidden');
            
            // Carregar primeiro hino (sem dar play) se houver hinos válidos
            if (AppState.hinos.length > 0 && !AppState.currentHino) {
                AppState.currentHino = AppState.hinos[0];
                updatePlayerUI();
                if(elements.audioPlayer) elements.audioPlayer.src = AppState.hinos[0].arquivo;
            }
        }, 800);
    } catch (error) {
        console.error('Erro fatal:', error);
    }
});

async function loadInitialData() {
    try {
        const response = await fetch('data/hinos.json');
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        
        const allData = await response.json();
        
        // --- FILTRO DE HINOS VÁLIDOS ---
        // Só carrega hinos que tenham título preenchido (remove os vazios e os "Em breve...")
        AppState.hinos = allData.filter(hino => hino.titulo && hino.titulo.trim() !== "");
        
        // A fila inicial é igual à lista de hinos válidos
        AppState.queue = [...AppState.hinos]; 
        
        const savedSettings = localStorage.getItem('hinosCCB_settings');
        if (savedSettings) AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
        
    } catch (error) {
        console.error("Erro dados:", error);
        showToast('Erro ao carregar lista de hinos', 'error');
    }
}

async function initModules() {
    const modules = ['FavoritesModule', 'PlaylistsModule', 'CategoriesModule', 'PlayerModule', 'ViewsModule', 'SettingsModule'];
    for (const mod of modules) {
        if (window[mod] && typeof window[mod].init === 'function') {
            if (mod === 'PlayerModule') await window[mod].init(elements.audioPlayer);
            else await window[mod].init();
        }
    }
}

function initAudioPlayer() {
    if (!elements.audioPlayer) return;
    elements.audioPlayer.volume = AppState.volume;
    
    elements.audioPlayer.addEventListener('timeupdate', () => {
        AppState.currentTime = elements.audioPlayer.currentTime;
        updateTimeDisplay();
        updateProgressBar();
    });
    
    elements.audioPlayer.addEventListener('ended', handleAudioEnded);
    
    elements.audioPlayer.addEventListener('play', () => {
        AppState.isPlaying = true;
        updatePlayerButtons();
        document.querySelector('.album-art')?.classList.add('playing');
    });
    
    elements.audioPlayer.addEventListener('pause', () => {
        AppState.isPlaying = false;
        updatePlayerButtons();
        document.querySelector('.album-art')?.classList.remove('playing');
    });
    
    elements.audioPlayer.addEventListener('loadedmetadata', () => {
        AppState.duration = elements.audioPlayer.duration;
        updateTimeDisplay();
    });
}

function initCoreUI() {
    // Atualiza referências DOM dinâmicas
    elements.playBtn = document.getElementById('play-btn');
    elements.prevBtn = document.getElementById('prev-btn');
    elements.nextBtn = document.getElementById('next-btn');
    elements.repeatBtn = document.getElementById('repeat-btn');
    elements.shuffleBtn = document.getElementById('shuffle-btn');
    elements.favoriteBtn = document.getElementById('favorite-btn');
    elements.progressSlider = document.getElementById('progress-slider');
    
    // Novos controles (Volume e Playlist)
    elements.volumeSlider = document.getElementById('volume-slider');
    elements.volumeBtn = document.getElementById('volume-btn');
    elements.playlistAddBtn = document.getElementById('playlist-add-btn');

    updateCounters();
}

// ===== GERENCIAMENTO DE EVENTOS =====
function initCoreEvents() {
    // Menu (Abrir/Fechar)
    if(elements.menuToggle) elements.menuToggle.onclick = openMenu;
    if(elements.menuClose) elements.menuClose.onclick = closeMenu;
    if(elements.menuOverlay) elements.menuOverlay.onclick = closeMenu;
    
    // Navegação do Menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            closeMenu();
            navigateToView(item.dataset.view);
        };
    });

    // ==========================================================
    // NOVA LÓGICA: BUSCA GLOBAL NO MENU LATERAL
    // ==========================================================
    if (elements.menuSearch) {
        // Evento ao pressionar ENTER
        elements.menuSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    performGlobalSearch(query);
                }
            }
        });
        
        // Opcional: Botão de lupa dentro do input do menu
        const searchIcon = elements.menuSearch.nextElementSibling; // O ícone <i>
        if (searchIcon && searchIcon.classList.contains('fa-search')) {
            searchIcon.style.cursor = 'pointer';
            searchIcon.onclick = () => {
                const query = elements.menuSearch.value.trim();
                if (query) performGlobalSearch(query);
            };
        }
    }

    // Inicializa eventos de Player e Tabs
    initPlayerEvents();
    initTabEvents();
}

// Função auxiliar para realizar a busca global
function performGlobalSearch(query) {
    closeMenu();
    
    // 1. Navega para a biblioteca (Todos os Hinos)
    navigateToView('library');
    
    // 2. Limpa o campo do menu para a próxima vez
    elements.menuSearch.value = '';
    
    // 3. Aplica o filtro na lista principal
    // Usamos setTimeout para garantir que a view 'library' carregou
    setTimeout(() => {
        const mainSearchInput = document.getElementById('hino-search');
        if (mainSearchInput) {
            mainSearchInput.value = query;
            mainSearchInput.focus();
            // Dispara o evento 'input' para que o filtro funcione
            mainSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, 100);
}

function initPlayerEvents() {
    // 1. Controles Principais
    if (elements.playBtn) elements.playBtn.onclick = togglePlayPause;
    if (elements.prevBtn) elements.prevBtn.onclick = playPrevious;
    if (elements.nextBtn) elements.nextBtn.onclick = playNext;
    if (elements.repeatBtn) elements.repeatBtn.onclick = toggleRepeatMode;
    if (elements.shuffleBtn) elements.shuffleBtn.onclick = toggleShuffleMode;
    
    // 2. Barra de Progresso
    if (elements.progressSlider) {
        elements.progressSlider.addEventListener('input', (e) => {
            const pct = parseInt(e.target.value);
            if (AppState.duration) {
                elements.audioPlayer.currentTime = (pct / 100) * AppState.duration;
            }
        });
    }

    // 3. Botão Favorito
    if (elements.favoriteBtn) {
        elements.favoriteBtn.onclick = handleFavoriteClick;
    }

    // 4. Botão Playlist (Dropdown)
    const plBtn = document.getElementById('playlist-add-btn');
    if (plBtn) {
        const newPlBtn = plBtn.cloneNode(true);
        plBtn.parentNode.replaceChild(newPlBtn, plBtn);
        elements.playlistAddBtn = newPlBtn;

        elements.playlistAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!AppState.currentHino) {
                showToast('Nenhum hino tocando', 'error');
                return;
            }
            togglePlayerPlaylistDropdown(newPlBtn);
        });
    }

    // 5. Controle de Volume
    const vSlider = document.getElementById('volume-slider');
    const vBtn = document.getElementById('volume-btn');

    if (vSlider && vBtn) {
        vSlider.value = AppState.volume;
        updateVolumeIcon(AppState.volume);

        vSlider.oninput = (e) => {
            const vol = parseFloat(e.target.value);
            AppState.volume = vol;
            if (window.PlayerModule) window.PlayerModule.setVolume(vol);
            updateVolumeIcon(vol);
        };

        vBtn.onclick = () => {
            if (AppState.volume > 0) {
                vBtn.dataset.lastVolume = AppState.volume;
                AppState.volume = 0;
                vSlider.value = 0;
            } else {
                AppState.volume = parseFloat(vBtn.dataset.lastVolume || 0.8);
                vSlider.value = AppState.volume;
            }
            if (window.PlayerModule) window.PlayerModule.setVolume(AppState.volume);
            updateVolumeIcon(AppState.volume);
        };
    }
}

function initTabEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
            
            if(tabId === 'lyrics') updateLyrics();
            if(tabId === 'queue') updateQueueUI();
        };
    });
}

// ===== NAVEGAÇÃO E RESTAURAÇÃO DO PLAYER =====

function navigateToView(viewName) {
    AppState.currentView = viewName;
    
    // Remove o botão "Voltar" antigo para não duplicar
    const backBtn = document.querySelector('.back-to-player-container');
    if (backBtn) backBtn.remove();
    
    if (viewName === 'player') {
        // 1. Restaura o HTML do Player se ele sumiu
        restorePlayerView();
        
        // 2. Remove as outras telas (Views)
        document.querySelectorAll('.library-view, .favorites-view, .playlists-view, .settings-view, .categories-view, .category-hinos-view, .playlist-detail-view').forEach(el => el.remove());
        
        // 3. Reconecta os eventos nos botões recriados
        initCoreUI();
        initCoreEvents();
        updatePlayerUI(); // Atualiza capa e textos
        
    } else {
        // Renderiza a view do módulo
        if (window.ViewsModule) {
            window.ViewsModule.renderView(viewName);
            addBackToPlayerButton(); // Adiciona o botão flutuante
        }
    }
}

// Esta função RECRIA o HTML do player quando voltamos do menu
function restorePlayerView() {
    const main = document.querySelector('.app-main');
    if (!main) return;
    
    // Se o player já existe, só garante que está visível
    const existing = main.querySelector('.player-container');
    if (existing) {
        existing.style.display = 'block';
        return;
    }

    // HTML Completo do Player (com os novos botões de Volume e Playlist)
    const playerHTML = `
        <div class="player-container fade-in">
            <div class="player-tabs">
                <button class="tab-btn" data-tab="queue"><i class="fas fa-list-ol"></i><span>Fila</span></button>
                <button class="tab-btn active" data-tab="player"><i class="fas fa-music"></i><span>Hino</span></button>
                <button class="tab-btn" data-tab="lyrics"><i class="fas fa-file-alt"></i><span>Letra</span></button>
            </div>
            
            <div class="tab-content">
                <div class="tab-pane active" id="player-tab">
                    <div class="album-art"><div class="art-placeholder"><i class="fas fa-music"></i></div></div>
                    
                    <div class="song-info">
                        <h2 id="song-title">Selecione um Hino</h2>
                    </div>
                    
                    <div class="secondary-controls">
                        <button id="favorite-btn" class="icon-btn" title="Favorito"><i class="far fa-heart"></i></button>
                        <button id="playlist-add-btn" class="icon-btn" title="Adicionar à playlist"><i class="fas fa-list-ul"></i></button>
                        <div class="volume-control-wrapper">
                            <button id="volume-btn" class="icon-btn"><i class="fas fa-volume-up"></i></button>
                            <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="0.8">
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <span id="current-time" class="time">0:00</span>
                        <div class="progress-bar">
                            <input type="range" id="progress-slider" value="0" max="100">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <span id="total-time" class="time">0:00</span>
                    </div>
                    
                    <div class="player-controls">
                        <button id="shuffle-btn" class="control-btn"><i class="fas fa-random"></i></button>
                        <button id="prev-btn" class="control-btn"><i class="fas fa-step-backward"></i></button>
                        <button id="play-btn" class="control-btn play-btn"><i class="fas fa-play"></i></button>
                        <button id="next-btn" class="control-btn"><i class="fas fa-step-forward"></i></button>
                        <button id="repeat-btn" class="control-btn"><i class="fas fa-redo"></i></button>
                    </div>
                </div>
                
                <div class="tab-pane" id="lyrics-tab">
                    <div class="lyrics-container">
                        <h3>Letra do Hino</h3>
                        <div id="lyrics-content" class="lyrics-content"><p>Carregando...</p></div>
                    </div>
                </div>
                
                <div class="tab-pane" id="queue-tab">
                    <div class="queue-container">
                        <div class="queue-header"><h3>Fila</h3></div>
                        <div id="queue-list" class="queue-list"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insere o HTML de volta na tela
    const bg = main.querySelector('.background-gradient');
    if (bg) bg.insertAdjacentHTML('afterend', playerHTML);
    else main.insertAdjacentHTML('afterbegin', playerHTML);
}

function addBackToPlayerButton() {
    if (document.querySelector('.back-to-player-container')) return;
    
    const btnDiv = document.createElement('div');
    btnDiv.className = 'back-to-player-container';
    btnDiv.innerHTML = `<button class="back-to-player" title="Voltar ao Player"><i class="fas fa-music"></i></button>`;
    
    btnDiv.querySelector('button').onclick = () => navigateToView('player');
    document.body.appendChild(btnDiv);
}

// ===== LÓGICA DE REPRODUÇÃO =====
function playHino(hino) {
    if (!hino) return;
    AppState.currentHino = hino;
    AppState.isPlaying = true;
    updatePlayerUI();
    
    if(window.FavoritesModule) window.FavoritesModule.updateFavoriteButton(hino.id);
    if(window.PlaylistsModule) window.PlaylistsModule.addToRecentlyPlayed(hino.id);

    elements.audioPlayer.src = hino.arquivo;
    elements.audioPlayer.play().catch(console.error);
}

function togglePlayPause() {
    if (!AppState.currentHino) {
        if(AppState.hinos.length) playHino(AppState.hinos[0]);
        return;
    }
    if (AppState.isPlaying) elements.audioPlayer.pause();
    else elements.audioPlayer.play();
}

function playNext() {
    if (!AppState.currentHino) return;
    const idx = AppState.queue.findIndex(h => h.id === AppState.currentHino.id);
    const next = AppState.queue[(idx + 1) % AppState.queue.length];
    playHino(next);
}

function playPrevious() {
    if (!AppState.currentHino) return;
    const idx = AppState.queue.findIndex(h => h.id === AppState.currentHino.id);
    const prev = AppState.queue[(idx - 1 + AppState.queue.length) % AppState.queue.length];
    playHino(prev);
}

function handleAudioEnded() {
    if (AppState.repeatMode === 'one') {
        elements.audioPlayer.currentTime = 0;
        elements.audioPlayer.play();
    } else if (AppState.settings.autoPlayNext) {
        playNext();
    } else {
        AppState.isPlaying = false;
        updatePlayerButtons();
    }
}

function toggleRepeatMode() {
    const modes = ['none', 'one', 'all'];
    AppState.repeatMode = modes[(modes.indexOf(AppState.repeatMode) + 1) % modes.length];
    showToast(`Repetir: ${AppState.repeatMode}`, 'info');
    updatePlayerButtons();
}

function toggleShuffleMode() {
    AppState.shuffleMode = !AppState.shuffleMode;
    if (AppState.shuffleMode) {
        const current = AppState.currentHino;
        const others = AppState.hinos.filter(h => h.id !== current?.id).sort(() => Math.random() - 0.5);
        AppState.queue = [current, ...others].filter(Boolean);
        showToast('Aleatório Ativado', 'success');
    } else {
        AppState.queue = [...AppState.hinos];
        showToast('Aleatório Desativado', 'info');
    }
    updatePlayerButtons();
}

function handleFavoriteClick() {
    if (!AppState.currentHino || !window.FavoritesModule) return;
    window.FavoritesModule.toggleFavorite(AppState.currentHino.id);
}

// ===== UI UPDATES =====
function updatePlayerUI() {
    if (!AppState.currentHino) return;
    
    // Textos
    const titleEl = document.getElementById('song-title');
    if(titleEl) titleEl.textContent = AppState.currentHino.titulo;
    
    
    // Capa Dinâmica
    const art = document.querySelector('.album-art');
    if (art) {
        const id = parseInt(AppState.currentHino.numero);
        const hue = (id * 137) % 360;
        art.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 80%, 40%))`;
    }
    updatePlayerButtons();
}

function updatePlayerButtons() {
    const playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.innerHTML = `<i class="fas fa-${AppState.isPlaying ? 'pause' : 'play'}"></i>`;
    
    document.getElementById('repeat-btn')?.classList.toggle('active', AppState.repeatMode !== 'none');
    document.getElementById('shuffle-btn')?.classList.toggle('active', AppState.shuffleMode);
}

function updateTimeDisplay() {
    document.getElementById('current-time').textContent = formatTime(AppState.currentTime);
    document.getElementById('total-time').textContent = formatTime(AppState.duration);
}

function updateProgressBar() {
    const fill = document.getElementById('progress-fill');
    const slider = document.getElementById('progress-slider');
    if (AppState.duration > 0) {
        const pct = (AppState.currentTime / AppState.duration) * 100;
        if(fill) fill.style.width = `${pct}%`;
        if(slider) slider.value = pct;
    }
}

function updateVolumeIcon(vol) {
    const vBtn = document.getElementById('volume-btn');
    if (!vBtn) return;
    const icon = vBtn.querySelector('i');
    icon.className = '';
    if (vol === 0) icon.className = 'fas fa-volume-mute';
    else if (vol < 0.5) icon.className = 'fas fa-volume-down';
    else icon.className = 'fas fa-volume-up';
}

function updateLyrics() {
    const container = document.getElementById('lyrics-content');
    if (container && AppState.currentHino) {
        container.innerHTML = AppState.currentHino.letra ? AppState.currentHino.letra.replace(/\n/g, '<br>') : '...';
    }
}

function updateQueueUI() {
    const container = document.getElementById('queue-list');
    if (!container) return;
    container.innerHTML = AppState.queue.map(h => `
        <div class="queue-item ${AppState.currentHino?.id === h.id ? 'active' : ''}" onclick="playHino(AppState.hinos.find(x => x.id === ${h.id}))">
            <span class="queue-number">${h.numero}</span><span class="queue-title">${h.titulo}</span>
        </div>
    `).join('');
}

// ===== MENU & NAVEGAÇÃO =====
function openMenu() {
    document.getElementById('side-menu')?.classList.add('active');
    document.getElementById('menu-overlay')?.classList.add('active');
    updateCounters();
}

function closeMenu() {
    document.getElementById('side-menu')?.classList.remove('active');
    document.getElementById('menu-overlay')?.classList.remove('active');
}

function updateCounters() {
    if(elements.favoritesCount && window.FavoritesModule) elements.favoritesCount.textContent = window.FavoritesModule.getCount();
    const all = document.getElementById('all-hinos-count');
    if(all) all.textContent = AppState.hinos.length;
}

// ===== PLAYLIST DROPDOWN =====
function togglePlayerPlaylistDropdown(btnElement) {
    // Verificar se já existe e fechar
    const existing = document.querySelector('.playlist-dropdown');
    if (existing) {
        existing.remove();
        return;
    }

    if (!window.PlaylistsModule) {
        showToast('Erro: Módulo de Playlists não carregado', 'error');
        return;
    }

    const hinoId = AppState.currentHino.id;
    const playlists = window.PlaylistsModule.getUserPlaylists();
    const rect = btnElement.getBoundingClientRect();

    // HTML do Dropdown (Sem o Footer com botão de criar)
    const dropdownHTML = `
        <div class="playlist-dropdown show" style="position: fixed; top: ${rect.bottom + 10}px; left: ${rect.left}px; transform: translateX(-50%); min-width: 220px;">
            <div class="playlist-dropdown-header">
                <i class="fas fa-list"></i> Adicionar à Playlist
            </div>
            <div class="playlist-dropdown-list">
                ${playlists.length === 0 ? `
                    <div class="empty-dropdown">
                        <p>Nenhuma playlist encontrada.</p>
                        <small style="color: #888; display: block; margin-top: 5px;">Crie uma no menu "Playlists".</small>
                    </div>
                ` : playlists.map(playlist => {
                    const hasHino = playlist.hinos.includes(hinoId);
                    return `
                        <div class="playlist-dropdown-item ${hasHino ? 'has-hino' : ''}" data-id="${playlist.id}">
                            <div class="playlist-dropdown-info">
                                <i class="${playlist.icon}" style="color: ${playlist.color}"></i>
                                <span>${playlist.name}</span>
                            </div>
                            ${hasHino ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dropdownHTML);

    // Adicionar eventos aos itens do dropdown
    const dropdown = document.querySelector('.playlist-dropdown');
    
    dropdown.querySelectorAll('.playlist-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const plId = item.dataset.id;
            const hasHino = item.classList.contains('has-hino');

            if (hasHino) {
                window.PlaylistsModule.removeHinoFromPlaylist(plId, hinoId);
                item.classList.remove('has-hino');
                const check = item.querySelector('.fa-check');
                if(check) check.remove();
            } else {
                window.PlaylistsModule.addHinoToPlaylist(plId, hinoId);
                item.classList.add('has-hino');
                item.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
            }
        });
    });

    // Fechar ao clicar fora
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!dropdown.contains(e.target) && e.target !== btnElement) {
                dropdown.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 50);
}

// ===== UTILITÁRIOS =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Exports
window.AppState = AppState;
window.elements = elements;
window.showToast = showToast;
window.playHino = playHino;
window.playNext = playNext;
window.playPrevious = playPrevious;
window.closeMenu = closeMenu;