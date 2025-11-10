import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTelegramUser, initTelegram, getTelegramWebApp } from "@/lib/telegram";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  _id: string;
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  walletAddress?: string;
  csrfToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  csrfToken: string | null;
  connectWallet: (address: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const telegramUser = getTelegramUser();
  const ADMIN_ID = 7263354123;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Initialize Telegram WebApp
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          console.log('Telegram WebApp initialized:', tg);
          console.log('InitDataUnsafe:', tg.initDataUnsafe);
          console.log('InitData:', tg.initData);

          const telegramUser = tg.initDataUnsafe?.user;

          if (telegramUser) {
            console.log('Telegram user found:', telegramUser);

            // Authenticate with backend
            console.log('Sending auth request with data:', {
              telegramId: telegramUser.id,
              username: telegramUser.username || `user${telegramUser.id}`,
              firstName: telegramUser.first_name || '',
              lastName: telegramUser.last_name || '',
            });

            const response = await fetch('/api/users/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramId: telegramUser.id,
                username: telegramUser.username || `user${telegramUser.id}`,
                firstName: telegramUser.first_name || '',
                lastName: telegramUser.last_name || '',
              }),
              credentials: 'include',
            });

            if (response.ok) {
              const userData = await response.json();
              console.log('Backend auth response:', userData);

              // Make sure we have all the data
              const fullUserData = {
                ...userData,
                telegramId: userData.telegramId || telegramUser.id,
                username: userData.username || telegramUser.username || `user${telegramUser.id}`,
                firstName: userData.firstName || telegramUser.first_name || '',
                lastName: userData.lastName || telegramUser.last_name || '',
              };

              console.log('Full user data:', fullUserData);
              setUser(fullUserData);
              setCsrfToken(userData.csrfToken || null);
            }
          } else {
            // Development fallback
            console.warn('No Telegram user data - using mock data for development');
            const mockUser = {
              telegramId: 123456789,
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
              balance: 100,
              walletAddress: null,
            };

            const response = await fetch('/api/users/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(mockUser),
              credentials: 'include',
            });

            if (response.ok) {
              const userData = await response.json();
              setUser({ ...mockUser, ...userData });
              setCsrfToken(userData.csrfToken || null);
            }
          }
        } else {
          // Development fallback when Telegram is not available
          console.warn('Telegram WebApp not available - using mock data');
          const mockUser = {
            telegramId: 123456789,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            balance: 100,
            walletAddress: null,
          };

          const response = await fetch('/api/users/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockUser),
            credentials: 'include',
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({ ...mockUser, ...userData });
            setCsrfToken(userData.csrfToken || null);
          }
        }
      } catch (error) {
        console.error('Telegram init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initTelegram();
  }, []);


  const connectWallet = async (walletAddress: string) => {
    try {
      if (!csrfToken) {
        console.error("No CSRF token available");
        return;
      }

      const response = await fetch("/api/users/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Hamyonni ulashda xatolik");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw error;
    }
  };

  const isAdmin = user?.telegramId === ADMIN_ID;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: loading,
        isAdmin,
        csrfToken,
        connectWallet: connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}