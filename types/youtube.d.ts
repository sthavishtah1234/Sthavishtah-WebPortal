declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: {
            autoplay?: number
            controls?: number
            disablekb?: number
            fs?: number
            rel?: number
            showinfo?: number
            iv_load_policy?: number
            modestbranding?: number
            cc_load_policy?: number
            playsinline?: number
            start?: number
            origin?: string
            mute?: number
          }
          events?: {
            onReady?: (event: any) => void
            onStateChange?: (event: any) => void
            onError?: (event: any) => void
          }
        },
      ) => any
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
  }
}

export {}
