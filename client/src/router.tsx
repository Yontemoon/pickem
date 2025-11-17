import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx"
const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
export const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
    // auth will be passed down from App component
    auth: undefined!,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
