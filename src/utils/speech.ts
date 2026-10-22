class SpeechManager {
  private utterance: SpeechSynthesisUtterance | null = null;
  private currentPlayingId: string | null = null;
  private onStateChangeCallback: ((playingId: string | null) => void) | null = null;

  public setListener(cb: (playingId: string | null) => void) {
    this.onStateChangeCallback = cb;
  }

  public speak(id: string, text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // If currently speaking this message, toggle pause/stop
    if (this.currentPlayingId === id) {
      this.stop();
      return;
    }

    this.stop();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .trim();

    if (!cleanText) return;

    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentPlayingId = id;
    this.onStateChangeCallback?.(id);

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      this.utterance.voice = naturalVoice;
    }

    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    this.utterance.onend = () => {
      this.currentPlayingId = null;
      this.onStateChangeCallback?.(null);
    };

    this.utterance.onerror = () => {
      this.currentPlayingId = null;
      this.onStateChangeCallback?.(null);
    };

    window.speechSynthesis.speak(this.utterance);
  }

  public stop() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    this.currentPlayingId = null;
    this.onStateChangeCallback?.(null);
  }

  public isPlaying(id: string) {
    return this.currentPlayingId === id;
  }
}

export const speechManager = new SpeechManager();
