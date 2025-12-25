// modules/storage.js - Gerenciamento de armazenamento local

const StorageModule = (() => {
    const PREFIX = 'hinosCCB_';
    
    // Salvar item
    const setItem = (key, value) => {
        try {
            const storageKey = PREFIX + key;
            const stringValue = JSON.stringify(value);
            localStorage.setItem(storageKey, stringValue);
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            return false;
        }
    };
    
    // Obter item
    const getItem = (key, defaultValue = null) => {
        try {
            const storageKey = PREFIX + key;
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Erro ao obter ${key}:`, error);
            return defaultValue;
        }
    };
    
    // Remover item
    const removeItem = (key) => {
        try {
            const storageKey = PREFIX + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error(`Erro ao remover ${key}:`, error);
            return false;
        }
    };
    
    // Limpar todos os dados do app
    const clearAll = () => {
        try {
            // Obter todas as chaves do localStorage
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remover cada chave
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`Removidos ${keysToRemove.length} itens do storage`);
            return true;
        } catch (error) {
            console.error('Erro ao limpar storage:', error);
            return false;
        }
    };
    
    // Obter tamanho usado pelo app
    const getUsage = () => {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(PREFIX)) {
                const value = localStorage.getItem(key);
                totalSize += (key.length + value.length) * 2; // Cada caractere = 2 bytes
            }
        }
        
        return {
            bytes: totalSize,
            kilobytes: (totalSize / 1024).toFixed(2),
            megabytes: (totalSize / (1024 * 1024)).toFixed(4)
        };
    };
    
    // Backup de dados
    const backup = () => {
        try {
            const backupData = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(PREFIX)) {
                    backupData[key] = localStorage.getItem(key);
                }
            }
            
            const backupStr = JSON.stringify(backupData);
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `hinos-ccb-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return false;
        }
    };
    
    // Restaurar de backup
    const restore = (backupData) => {
        try {
            if (typeof backupData === 'string') {
                backupData = JSON.parse(backupData);
            }
            
            // Limpar dados existentes primeiro
            clearAll();
            
            // Restaurar dados
            Object.keys(backupData).forEach(key => {
                localStorage.setItem(key, backupData[key]);
            });
            
            console.log('Backup restaurado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return false;
        }
    };
    
    // Expor API
    return {
        setItem,
        getItem,
        removeItem,
        clearAll,
        getUsage,
        backup,
        restore
    };
})();

window.StorageModule = StorageModule;
console.log('Módulo Storage carregado');