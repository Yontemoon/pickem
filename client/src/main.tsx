import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx"
import App from "./app.tsx"
import "./styles.css"
import reportWebVitals from "./reportWebVitals.ts"
import { ThemeProvider } from "./providers/theme.tsx"

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
