/**
 * Veyron Prime Player - Ana Başlatıcı
 * Modülleri yükledikten sonra uygulamayı başlatır
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    function bootstrap() {
        if (VeyronApp.appHandlers && typeof VeyronApp.appHandlers.init === 'function') {
            VeyronApp.appHandlers.init();
        } else {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', bootstrap);
            } else {
                setTimeout(bootstrap, 50);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
