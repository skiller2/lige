import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

type SoundKey = 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class AudioService {

    private sounds = new Map<SoundKey, HTMLAudioElement>();
    private init() {
        this.register('success', 'assets/sounds/success_beep.wav');
        this.register('error', 'assets/sounds/error_beep.wav');
    }

    private _init = this.init();
    // ✅ Register sounds (library-like behavior)
    register(key: SoundKey, url: string) {
        if (!this.sounds.has(key)) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            this.sounds.set(key, audio);
        }
    }



    private lastPlay = 0;

    async play(key: SoundKey) {
        const now = Date.now();
        if (now - this.lastPlay < 100) return;
        this.lastPlay = now;
        const audio = this.sounds.get(key);
        if (!audio) return;

        try {
            audio.currentTime = 0; // allow rapid replay
            await audio.play();    // ✅ modern async API
        } catch (e) {
            // Browser blocked autoplay → ignore silently or log
            console.warn('Audio blocked until user interaction');
        }
    }

    // ✅ Convenience methods
    playSuccess() {
        this.play('success');
    }

    playError() {
        this.play('error');
    }
}