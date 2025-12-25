// modules/settings.js - Módulo de Configurações (CORRIGIDO)

const SettingsModule = (() => {
    let isInitialized = false;
    
    // CONFIGURAÇÃO PADRÃO: Dark Mode = TRUE (Original)
    const defaultSettings = {
        darkMode: true,           
        autoPlayNext: true,       
        showLyrics: true,         
        fontSize: 'medium',       
        animations: true          
    };

    const init = () => {
        try {
            // Tenta carregar do storage, se não existir usa o padrão
            const savedSettings = window.StorageModule?.getItem('settings');
            
            // Mescla o salvo com o padrão (garante que chaves novas existam)
            window.AppState.settings = { ...defaultSettings, ...savedSettings };
            
            // Aplica visualmente
            applyTheme();
            applyFontSize();
            applyAnimations();
            
            isInitialized = true;
            console.log('Módulo Settings inicializado');
            return true;
        } catch (error) {
            console.error('Erro settings:', error);
            return false;
        }
    };

    // --- APLICAÇÃO VISUAL ---

    const applyTheme = () => {
        const isDark = window.AppState.settings.darkMode;
        
        // Lógica: Se for Dark Mode, REMOVE a classe light-mode.
        // Se NÃO for Dark Mode, ADICIONA a classe light-mode.
        if (isDark) {
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
        }
        
        // Atualiza a cor da barra do navegador mobile
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', isDark ? '#121212' : '#F5F5F5');
        }
    };

    const applyFontSize = () => {
        const size = window.AppState.settings.fontSize;
        const root = document.documentElement;
        
        if(size === 'large') root.style.setProperty('--font-scale', '1.1');
        else if(size === 'extra-large') root.style.setProperty('--font-scale', '1.25');
        else root.style.setProperty('--font-scale', '1.0');
    };

    const applyAnimations = () => {
        if (!window.AppState.settings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    };

    // --- SALVAR E ALTERAR ---

    const toggleSetting = (key) => {
        window.AppState.settings[key] = !window.AppState.settings[key];
        
        if (key === 'darkMode') applyTheme();
        if (key === 'animations') applyAnimations();
        
        saveSettings();
    };

    const setSetting = (key, value) => {
        window.AppState.settings[key] = value;
        if (key === 'fontSize') applyFontSize();
        saveSettings();
    };

    const saveSettings = () => {
        if (window.StorageModule) {
            window.StorageModule.setItem('settings', window.AppState.settings);
        }
    };

    // --- RENDERIZAR TELA ---

    const renderSettingsView = () => {
        const s = window.AppState.settings;
        
        let contentHTML = `
            <div class="settings-view fade-in">
                <div class="view-header">
                    <h2><i class="fas fa-cog"></i> Configurações</h2>
                </div>

                <div class="settings-container">
                    
                    <div class="settings-section">
                        <h3><i class="fas fa-paint-brush"></i> Aparência</h3>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Modo Escuro</h4>
                                <p>Usar o tema original escuro</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="toggle-darkmode" ${s.darkMode ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Tamanho do Texto</h4>
                            </div>
                            <select id="select-fontsize" class="settings-select">
                                <option value="medium" ${s.fontSize === 'medium' ? 'selected' : ''}>Normal</option>
                                <option value="large" ${s.fontSize === 'large' ? 'selected' : ''}>Grande</option>
                                <option value="extra-large" ${s.fontSize === 'extra-large' ? 'selected' : ''}>Muito Grande</option>
                            </select>
                        </div>
                        
                         <div class="setting-item">
                            <div class="setting-info">
                                <h4>Animações</h4>
                                <p>Efeitos visuais</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="toggle-animations" ${s.animations ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3><i class="fas fa-play-circle"></i> Reprodução</h3>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Tocar Próximo</h4>
                                <p>Avançar automaticamente</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="toggle-autoplay" ${s.autoPlayNext ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Exibir Letras</h4>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="toggle-lyrics" ${s.showLyrics ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3><i class="fas fa-database"></i> Dados</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Resetar Aplicativo</h4>
                                <p style="color: #f44336;">Apagar tudo e reiniciar</p>
                            </div>
                            <button id="btn-reset-app" class="btn-danger btn-sm">
                                <i class="fas fa-trash-alt"></i> Resetar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Injetar HTML
        if (window.ViewsModule && window.ViewsModule.replaceMainContent) {
            window.ViewsModule.replaceMainContent(contentHTML);
        }

        // Adicionar eventos (Listeners)
        setTimeout(() => {
            document.getElementById('toggle-darkmode')?.addEventListener('change', () => toggleSetting('darkMode'));
            document.getElementById('toggle-animations')?.addEventListener('change', () => toggleSetting('animations'));
            document.getElementById('toggle-autoplay')?.addEventListener('change', () => toggleSetting('autoPlayNext'));
            document.getElementById('toggle-lyrics')?.addEventListener('change', () => toggleSetting('showLyrics'));
            
            document.getElementById('select-fontsize')?.addEventListener('change', (e) => {
                setSetting('fontSize', e.target.value);
            });

            document.getElementById('btn-reset-app')?.addEventListener('click', () => {
                if(confirm('Isso apagará seus favoritos e playlists. Continuar?')) {
                    if (window.StorageModule) window.StorageModule.clearAll();
                    window.location.reload();
                }
            });
        }, 100);
    };

    return {
        init,
        renderSettingsView,
        toggleSetting
    };
})();

window.SettingsModule = SettingsModule;