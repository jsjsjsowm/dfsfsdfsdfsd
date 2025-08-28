declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export class TelegramAPI {
  private static instance: TelegramAPI;
  private webApp: any;

  private constructor() {
    this.webApp = window.Telegram?.WebApp;
  }

  public static getInstance(): TelegramAPI {
    if (!TelegramAPI.instance) {
      TelegramAPI.instance = new TelegramAPI();
    }
    return TelegramAPI.instance;
  }

  public isAvailable(): boolean {
    // Check if we're in Telegram WebApp or development/demo mode
    return !!this.webApp || 
           window.location.hostname === 'localhost' || 
           window.location.hostname.includes('replit') ||
           window.location.hostname.includes('netlify') ||
           window.location.hostname.includes('vercel');
  }

  public getUser(): TelegramUser | null {
    // Return real Telegram user if available
    if (this.webApp?.initDataUnsafe?.user) {
      return this.webApp.initDataUnsafe.user;
    }
    
    // Return demo user for development/testing
    if (this.isAvailable()) {
      return {
        id: 123456789,
        first_name: "Demo",
        username: "demo_user"
      };
    }
    
    return null;
  }

  public ready(): void {
    if (this.webApp) {
      this.webApp.ready();
      this.webApp.expand();
    }
  }

  public close(): void {
    if (this.webApp) {
      this.webApp.close();
    }
  }

  public showMainButton(text: string, onClick: () => void): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.text = text;
      this.webApp.MainButton.onClick(onClick);
      this.webApp.MainButton.show();
    }
  }

  public hideMainButton(): void {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.hide();
    }
  }
}

export const telegram = TelegramAPI.getInstance();
