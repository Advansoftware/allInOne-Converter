import Pusher from 'pusher-js';

export interface JobUpdate {
  job_id: string;
  type: string;
  status: string;
  progress: number;
  file_name: string | null;
  error: string | null;
  metadata: Record<string, any> | null;
  timestamp: string;
}

type JobUpdateCallback = (update: JobUpdate) => void;

class WebSocketService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private listeners: JobUpdateCallback[] = [];
  private connected: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization - connect when first listener is added
  }

  private connect() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const key = import.meta.env.VITE_PUSHER_KEY || 'allone-key';
      const host = import.meta.env.VITE_PUSHER_HOST || 'localhost';
      const port = parseInt(import.meta.env.VITE_PUSHER_PORT || '6001');

      console.log('🔌 Connecting to WebSocket...', { key, host, port });

      this.pusher = new Pusher(key, {
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        cluster: 'mt1',
      });

      this.pusher.connection.bind('connected', () => {
        console.log('✅ WebSocket connected');
        this.connected = true;
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('❌ WebSocket disconnected');
        this.connected = false;
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('WebSocket error:', error);
        this.connected = false;
      });

      // Subscribe to jobs channel
      this.channel = this.pusher.subscribe('jobs');

      // Listen for job updates
      this.channel.bind('job.updated', (data: any) => {
        console.log('📨 Job update received:', data);
        // Parse data if it's a string
        const update: JobUpdate = typeof data === 'string' ? JSON.parse(data) : data;
        this.notifyListeners(update);
      });

      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Subscribed to jobs channel');
      });

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Failed to subscribe to jobs channel:', error);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.initialized = false;
    }
  }

  public onJobUpdate(callback: JobUpdateCallback): () => void {
    // Connect on first listener
    if (!this.initialized) {
      this.connect();
    }

    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(update: JobUpdate) {
    this.listeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in job update listener:', error);
      }
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
      this.connected = false;
      this.initialized = false;
    }
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
