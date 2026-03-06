/**
 * PresentationMode — auto-plays through events chronologically.
 *
 * Emits events via callbacks:
 *   onEvent(node, index)   — called for each event during playback
 *   onEnd()                — called when the last event is reached
 */
export class PresentationMode {
  /**
   * @param {Array}    events       sorted event list (oldest → newest)
   * @param {Function} onEvent      callback(event, index) per step
   * @param {Function} [onEnd]      callback when playback ends
   * @param {number}   [speed=4000] ms between events
   */
  constructor(events, onEvent, onEnd = () => {}, speed = 4000) {
    this.events = events
    this.onEvent = onEvent
    this.onEnd = onEnd
    this.speed = speed

    this._index = 0
    this._timer = null
    this.isPlaying = false
    this.isPaused = false
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  play() {
    if (this.isPlaying && !this.isPaused) return
    this.isPlaying = true
    this.isPaused = false
    this._tick()
  }

  pause() {
    if (!this.isPlaying) return
    this.isPaused = true
    clearTimeout(this._timer)
    this._timer = null
  }

  resume() {
    if (!this.isPaused) return
    this.isPaused = false
    this._tick()
  }

  stop() {
    this.isPlaying = false
    this.isPaused = false
    this._index = 0
    clearTimeout(this._timer)
    this._timer = null
  }

  /** Jump to a specific event index and continue from there. */
  seekTo(index) {
    this._index = Math.max(0, Math.min(index, this.events.length - 1))
    if (this.isPlaying && !this.isPaused) {
      clearTimeout(this._timer)
      this._tick()
    }
  }

  setSpeed(ms) {
    this.speed = ms
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _tick() {
    if (!this.isPlaying || this.isPaused) return

    const event = this.events[this._index]
    this.onEvent(event, this._index)

    if (this._index >= this.events.length - 1) {
      this.isPlaying = false
      this.onEnd()
      return
    }

    this._index++
    this._timer = setTimeout(() => this._tick(), this.speed)
  }

  get progress() {
    return this.events.length > 0 ? this._index / (this.events.length - 1) : 0
  }

  get currentIndex() {
    return this._index
  }
}
