import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "../lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="mono text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-bright">Sector not found</h2>
        <p className="mono mt-2 text-[11px] text-muted">
          The requested route is not registered in this terminal.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="mono inline-flex items-center justify-center rounded-[3px] border border-primary px-4 py-2 text-[11px] tracking-widest text-primary transition-colors hover:bg-primary-dim"
          >
            RETURN TO CONSOLE
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Runtime Exception Captured:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-bright">This page didn't load</h1>
        <p className="mono mt-2 text-[11px] text-muted">
          A runtime fault interrupted the console. Try reinitializing.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mono rounded-[3px] border border-primary px-4 py-2 text-[11px] tracking-widest text-primary transition-colors hover:bg-primary-dim"
          >
            RETRY
          </button>
          <a
            href="/"
            className="mono rounded-[3px] border border-line px-4 py-2 text-[11px] tracking-widest text-dim transition-colors hover:border-primary"
          >
            GO HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NIST Risk Assessment & Risk Quant Engine" },
      {
        name: "description",
        content:
          "NIST SP 800-30 Rev. 1 and FAIR-compliant quantitative cybersecurity risk assessment engine featuring Monte Carlo ALE simulations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="tactical">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
