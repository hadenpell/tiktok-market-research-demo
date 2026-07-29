import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

// Demo build: a single page, no routing, no auth, no landing page.
function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

export default App;
