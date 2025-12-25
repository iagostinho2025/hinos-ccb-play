// modules/utils.js - Funções utilitárias gerais

const UtilsModule = (() => {
    // Formatar tempo (minutos:segundos)
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Gerar gradiente baseado em número
    const generateGradientFromNumber = (number) => {
        const numericId = parseInt(number) || 1;
        const hue = (numericId * 137) % 360;
        
        const color1 = `hsl(${hue}, 70%, 50%)`;
        const color2 = `hsl(${hue + 30}, 80%, 40%)`;
        const color3 = `hsl(${hue - 30}, 60%, 60%)`;
        
        return `radial-gradient(circle at 30% 30%, ${color1} 0%, ${color2} 50%, ${color3} 100%)`;
    };
    
    // Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // Throttle function
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };
    
    // Validar email
    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    // Capitalizar primeira letra
    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    
    // Formatar número com zeros à esquerda
    const padNumber = (num, size = 3) => {
        return num.toString().padStart(size, '0');
    };
    
    // Obter parâmetros da URL
    const getUrlParams = () => {
        const params = {};
        window.location.search.substring(1).split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[key] = decodeURIComponent(value || '');
        });
        return params;
    };
    
    // Copiar para clipboard
    const copyToClipboard = (text) => {
        return navigator.clipboard.writeText(text).then(() => {
            return true;
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            return false;
        });
    };
    
    // Verificar se é dispositivo móvel
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    // Obter data formatada
    const formatDate = (date = new Date(), format = 'pt-BR') => {
        return new Date(date).toLocaleDateString(format, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    
    // Expor API
    return {
        formatTime,
        generateGradientFromNumber,
        debounce,
        throttle,
        isValidEmail,
        capitalize,
        padNumber,
        getUrlParams,
        copyToClipboard,
        isMobile,
        formatDate
    };
})();

window.UtilsModule = UtilsModule;
console.log('Módulo Utils carregado');