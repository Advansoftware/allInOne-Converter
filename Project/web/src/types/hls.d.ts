declare module 'hls.js' {
  export interface HlsConfig {
    enableWorker?: boolean;
    lowLatencyMode?: boolean;
    [key: string]: any;
  }

  export interface HlsEvents {
    MANIFEST_PARSED: string;
    ERROR: string;
    [key: string]: string;
  }

  export interface ErrorData {
    type: string;
    details: string;
    fatal: boolean;
    url?: string;
    reason?: string;
    response?: any;
    [key: string]: any;
  }

  export default class Hls {
    static isSupported(): boolean;
    static readonly Events: HlsEvents;

    constructor(config?: Partial<HlsConfig>);

    loadSource(src: string): void;
    attachMedia(media: HTMLMediaElement): void;
    destroy(): void;
    on(event: string, callback: (event: string, data: any) => void): void;
    off(event: string, callback?: (event: string, data: any) => void): void;

    readonly levels: any[];
    currentLevel: number;
    autoLevelEnabled: boolean;
  }
}
