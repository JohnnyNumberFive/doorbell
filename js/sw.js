const CACHE_NAME = 'doorbell-pwa-cache-v1';

// Список локальных файлов интерфейса, которые телефон сохранит в свою память
const ASSETS_TO_CACHE = [
    'index.html',
    'css/style.css',
    'js/pusher.min.js', // Локальная библиотека Pusher для работы в режиме офлайн
    'js/app.js',
    'manifest.json'
];

// Этап установки: скачиваем и кэшируем статические ресурсы фронтенда
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Кэширование статических ресурсов фронтенда');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Этап активации: очищаем старые версии кэша, если они были
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Удаление старого кэша:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Перехват сетевых запросов
self.addEventListener('fetch', (event) => {
    // Игнорируем динамические WebSocket-запросы авторизации к Pusher (их кэшировать нельзя)
    if (event.request.url.includes('://pusher.com') || event.request.url.includes('pusherapp.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Если сеть доступна, отдаем свежий файл
                return response;
            })
            .catch(() => {
                // Если интернета на телефоне нет, достаем интерфейс из локального кэша
                return caches.match(event.request);
            })
    );
});