declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        videoId: string;
        events?: {
          onStateChange?: (event: { data: number }) => void;
          onReady?: () => void;
        };
      }) => {
        addEventListener: (event: string, fn: (obj: { info: { seekableRangeEnd: number; currentTime: number } }) => void) => void;
        getCurrentTime: () => number;
        getDuration: () => number;
        destroy: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
    Vimeo: {
      Player: new (element: HTMLIFrameElement) => {
        on: (event: string, callback: (data: unknown) => void) => void;
        getCurrentTime: () => Promise<number>;
        getDuration: () => Promise<number>;
        destroy: () => Promise<void>;
      };
    };
  }
}

export {};
