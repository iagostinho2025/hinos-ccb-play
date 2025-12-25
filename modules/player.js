// modules/player.js - Módulo do Player de Áudio (COM MEDIA SESSION API)

const PlayerModule = (() => {
    let audioElement = null;
    let isInitialized = false;
    
    const init = (audioEl) => {
        if (!audioEl) {
            console.error('Elemento de áudio não fornecido');
            return false;
        }
        
        audioElement = audioEl;
        
        // Configurar eventos do áudio
        audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('error', handleError);
        
        // Configurar volume inicial
        audioElement.volume = 0.8;
        
        // Inicializar Media Session se suportado
        if ('mediaSession' in navigator) {
            setupMediaSessionActions();
        }
        
        isInitialized = true;
        console.log('Módulo Player inicializado com Media Session Support');
        return true;
    };
    
    // Configura as ações dos botões (Play, Pause, Next, Prev) apenas uma vez
    const setupMediaSessionActions = () => {
        if (!('mediaSession' in navigator)) return;

        const actionHandlers = [
            ['play', () => play()],
            ['pause', () => pause()],
            ['previoustrack', () => {
                if (window.playPrevious) window.playPrevious();
            }],
            ['nexttrack', () => {
                if (window.playNext) window.playNext();
            }],
            ['stop', () => {
                pause();
                if (window.AppState) window.AppState.currentTime = 0;
                updateUI();
            }],
            ['seekto', (details) => {
                if (details.fastSeek && 'fastSeek' in audioElement) {
                    audioElement.fastSeek(details.seekTime);
                    return;
                }
                setCurrentTime(details.seekTime);
            }]
        ];

        for (const [action, handler] of actionHandlers) {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch (error) {
                console.warn(`A ação de mídia '${action}' não é suportada.`);
            }
        }
    };

    // Atualiza os METADADOS (Título, Artista, Capa) na notificação
    const updateMediaSessionMetadata = () => {
        if (!('mediaSession' in navigator) || !window.AppState?.currentHino) return;

        const hino = window.AppState.currentHino;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `${hino.numero} - ${hino.titulo}`,
            artist: 'Hinos CCB',
            album: 'Hinário 5',
            artwork: [
                { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
                { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        
        // Atualiza o estado de reprodução (playing/paused) para o sistema
        // Isso ajuda o sistema a saber se deve mostrar o botão de pause ou play
        if (window.AppState.isPlaying) {
            navigator.mediaSession.playbackState = "playing";
        } else {
            navigator.mediaSession.playbackState = "paused";
        }
    };
    
    const playHino = (hino) => {
        if (!isInitialized || !audioElement) {
            console.error('Player não inicializado');
            return false;
        }
        
        if (!hino || !hino.arquivo) {
            console.error('Hino inválido');
            return false;
        }
        
        // Atualizar estado global
        if (window.AppState) {
            window.AppState.currentHino = hino;
            window.AppState.isPlaying = true;
        }
        
        // Configurar e tocar áudio
        audioElement.src = hino.arquivo;
        audioElement.load();
        
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Atualizar UI e Media Session após o play iniciar com sucesso
                updateUI(); 
            }).catch(error => {
                console.error('Erro ao reproduzir:', error);
                showToast('Erro ao reproduzir o áudio', 'error');
                if (window.AppState) {
                    window.AppState.isPlaying = false;
                }
                updateUI();
            });
        }
        
        console.log(`Tocando: ${hino.numero} - ${hino.titulo}`);
        return true;
    };
    
    const pause = () => {
        if (!isInitialized || !audioElement) return;
        
        audioElement.pause();
        if (window.AppState) {
            window.AppState.isPlaying = false;
        }
        updateUI();
    };
    
    const play = () => {
        if (!isInitialized || !audioElement) return;
        
        audioElement.play().then(() => {
            if (window.AppState) {
                window.AppState.isPlaying = true;
            }
            updateUI();
        }).catch(error => {
            console.error('Erro ao retomar:', error);
        });
    };
    
    const togglePlayPause = () => {
        if (!isInitialized || !audioElement) return;
        
        if (window.AppState?.isPlaying) {
            pause();
        } else {
            play();
        }
    };
    
    const setCurrentTime = (seconds) => {
        if (!isInitialized || !audioElement) return;
        
        if (!isNaN(seconds) && seconds >= 0 && seconds <= audioElement.duration) {
            audioElement.currentTime = seconds;
        }
    };
    
    const setVolume = (volume) => {
        if (!isInitialized || !audioElement) return;
        
        const newVolume = Math.max(0, Math.min(1, volume));
        audioElement.volume = newVolume;
        
        if (window.AppState) {
            window.AppState.volume = newVolume;
        }
    };
    
    // Handlers de eventos
    const handleLoadedMetadata = () => {
        if (window.AppState) {
            window.AppState.duration = audioElement.duration;
        }
        updateUI();
    };
    
    const handleTimeUpdate = () => {
        if (window.AppState) {
            window.AppState.currentTime = audioElement.currentTime;
        }
        // Nota: Não chamamos updateMediaSessionMetadata aqui para não sobrecarregar
        // Apenas atualizamos a UI visual do app
        updateVisualUI();
    };
    
    const handleEnded = () => {
        console.log('Áudio terminado');
        if (window.AppState) window.AppState.isPlaying = false;
        
        // Notificar o app.js para tocar o próximo (se autoplay estiver ligado)
        // O app.js já tem um listener 'ended', mas como backup:
        if (window.AppState?.settings?.autoPlayNext && window.playNext) {
             window.playNext();
        } else {
            updateUI();
        }
    };
    
    const handleError = (e) => {
        console.error('Erro no player:', e);
        showToast('Erro no player de áudio', 'error');
    };
    
    // Função principal de atualização (Visual + Sistema)
    const updateUI = () => {
        updateVisualUI();
        updateMediaSessionMetadata();
    };

    // Atualizar apenas os elementos visuais do DOM
    const updateVisualUI = () => {
        if (!window.elements) return;
        
        const { currentTime, totalTime, progressFill, playBtn } = window.elements;
        
        // Atualizar tempo atual
        if (currentTime && window.AppState) {
            currentTime.textContent = formatTime(window.AppState.currentTime);
        }
        
        // Atualizar tempo total
        if (totalTime && window.AppState) {
            totalTime.textContent = formatTime(window.AppState.duration);
        }
        
        // Atualizar barra de progresso
        if (progressFill && window.AppState && window.AppState.duration > 0) {
            const progress = (window.AppState.currentTime / window.AppState.duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        // Atualizar botão play/pause
        if (playBtn && window.AppState) {
            const icon = window.AppState.isPlaying ? 'pause' : 'play';
            playBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
            playBtn.title = window.AppState.isPlaying ? 'Pausar' : 'Reproduzir';
        }
        
        // Atualizar botão de favorito
        if (window.FavoritesModule && window.AppState?.currentHino) {
            window.FavoritesModule.updateFavoriteButton();
        }
    };
    
    // Função utilitária
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Expor API pública
    return {
        init,
        playHino,
        pause,
        play,
        togglePlayPause,
        setCurrentTime,
        setVolume,
        updateUI
    };
})();

window.PlayerModule = PlayerModule;
console.log('Módulo Player carregado');