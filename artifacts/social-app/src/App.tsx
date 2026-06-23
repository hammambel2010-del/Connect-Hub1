import { useEffect, useRef } from "react";
import { ClerkProvider, Show, useClerk, useAuth } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/layout";
import { LoadingScreen } from "@/components/loading-screen";

import HomePage from "@/pages/home";
import MessagesPage from "@/pages/messages";
import DirectMessagePage from "@/pages/messages-id";
import GroupsPage from "@/pages/groups";
import NewGroupPage from "@/pages/groups-new";
import GroupDetailPage from "@/pages/groups-id";
import FriendsPage from "@/pages/friends";
import SearchPage from "@/pages/search";
import ProfilePage from "@/pages/profile";
import UserProfilePage from "@/pages/profile-id";
import AdminPage from "@/pages/admin";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
// Proxy only works in production; in dev Clerk uses its own CDN
const clerkProxyUrl = import.meta.env.PROD ? basePath + "/api/__clerk" : undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(222 47% 11%)",
    colorBackground: "hsl(220 33% 98%)",
    colorInput: "hsl(214.3 31.8% 91.4%)",
    fontFamily: "'Tajawal', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <HomePage />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "مرحباً بعودتك",
            subtitle: "قم بتسجيل الدخول للوصول لحسابك",
          },
        },
        signUp: {
          start: {
            title: "إنشاء حساب",
            subtitle: "ابدأ التواصل اليوم",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/messages" component={() => <ProtectedRoute component={MessagesPage} />} />
          <Route path="/messages/:userId" component={() => <ProtectedRoute component={DirectMessagePage} />} />
          <Route path="/groups" component={() => <ProtectedRoute component={GroupsPage} />} />
          <Route path="/groups/new" component={() => <ProtectedRoute component={NewGroupPage} />} />
          <Route path="/groups/:groupId" component={() => <ProtectedRoute component={GroupDetailPage} />} />
          <Route path="/friends" component={() => <ProtectedRoute component={FriendsPage} />} />
          <Route path="/search" component={() => <ProtectedRoute component={SearchPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route path="/profile/:userId" component={() => <ProtectedRoute component={UserProfilePage} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
