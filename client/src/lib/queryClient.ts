import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { StaticStorage } from "./storage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Check if we're in static mode (no backend available)
const isStaticMode = () => {
  return window.location.hostname.includes('netlify') || 
         window.location.hostname.includes('vercel') ||
         window.location.hostname.includes('github.io');
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle static mode with localStorage
  if (isStaticMode()) {
    return handleStaticRequest(method, url, data);
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

async function handleStaticRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const userId = '123456789'; // Demo user ID
  
  // Simulate API responses using localStorage
  if (url.includes('/api/auth/telegram')) {
    return new Response(JSON.stringify({ user: { telegramId: userId, username: 'Demo' } }));
  }
  
  if (url.includes('/api/player/')) {
    const player = StaticStorage.getPlayer(userId);
    return new Response(JSON.stringify(player));
  }
  
  if (url.includes('/api/daily-rewards/')) {
    const rewards = StaticStorage.getDailyRewards(userId);
    return new Response(JSON.stringify(rewards));
  }
  
  if (url.includes('/api/achievements/')) {
    const achievements = StaticStorage.getAchievements(userId);
    return new Response(JSON.stringify(achievements));
  }
  
  if (url.includes('/api/leaderboard')) {
    const leaderboard = StaticStorage.getLeaderboard();
    return new Response(JSON.stringify(leaderboard));
  }
  
  // Default response
  return new Response(JSON.stringify({ success: true }));
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Handle static mode
    if (isStaticMode()) {
      const res = await handleStaticRequest('GET', url);
      return await res.json();
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
