(function () {
    var STORAGE_KEY = 'hydra_bgm_state';
    var script = document.currentScript || document.querySelector('script[data-audio]');
    var audioSrc = script ? script.getAttribute('data-audio') : 'mw.mp3';
    var isIndex = !!document.getElementById('preClickOverlay');

    var audio = document.getElementById('mwTheme');
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'mwTheme';
        audio.src = audioSrc;
        audio.preload = 'auto';
        audio.loop = true;
        document.body.appendChild(audio);
    }

    var state = {};
    try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        state = {};
    }

    var restored = false;
    var restoreTime = function () {
        if (restored) return;
        if (typeof state.time !== 'number' || !isFinite(state.time) || state.time <= 0) {
            restored = true;
            return;
        }
        var duration = audio.duration;
        if (!isFinite(duration) || duration <= 0) return;
        try {
            audio.currentTime = Math.min(state.time, duration - 0.1);
            restored = true;
        } catch (e) {}
    };

    audio.addEventListener('loadedmetadata', restoreTime);
    audio.addEventListener('canplay', restoreTime);
    if (audio.readyState >= 1) restoreTime();
    setTimeout(restoreTime, 500);

    if (typeof state.volume === 'number') {
        audio.volume = Math.min(1, Math.max(0, state.volume));
    }

    var save = function () {
        if (audio.paused && audio.currentTime === 0) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                time: audio.currentTime || 0,
                playing: !audio.paused,
                volume: audio.volume
            }));
        } catch (e) {}
    };

    setInterval(save, 1000);
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);

    var tryPlay = function () {
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
    };

    var resumeOnGesture = function () {
        if (audio.paused) tryPlay();
    };

    if (!isIndex) {
        if (state.playing !== false) tryPlay();
        document.addEventListener('pointerdown', resumeOnGesture, { once: true });
        document.addEventListener('keydown', resumeOnGesture, { once: true });
    }
})();
