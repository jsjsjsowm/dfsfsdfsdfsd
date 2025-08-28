import { useState, useEffect } from "react";
import { telegram, type TelegramUser } from "@/lib/telegram";
import { apiRequest } from "@/lib/queryClient";

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        telegram.ready();
        
        const telegramUser = telegram.getUser();
        if (telegramUser) {
          setUser(telegramUser);
          
          try {
            // Try to authenticate with backend
            const response = await apiRequest("POST", "/api/auth/telegram", telegramUser);
            const data = await response.json();
            
            if (data.user) {
              setIsAuthenticated(true);
            }
          } catch (error) {
            // If backend is not available, still allow demo mode
            console.log("Backend not available, running in demo mode");
            setIsAuthenticated(true);
          }
        } else {
          // No user available, still allow demo mode
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to initialize Telegram:", error);
        // Always allow demo mode even if Telegram fails
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTelegram();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAvailable: telegram.isAvailable(),
    close: () => telegram.close(),
    showMainButton: (text: string, onClick: () => void) => telegram.showMainButton(text, onClick),
    hideMainButton: () => telegram.hideMainButton(),
  };
}
