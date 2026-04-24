import { createContext, useContext, useState } from "react";

const SearchProgressContext = createContext(null);

export function SearchProgressProvider({ children }) {
  const [progress, setProgress] = useState({
    hasStartedSearch: false,
    hasDiscoveryResults: false,
    hasFinalResults: false,
  });

  return (
    <SearchProgressContext.Provider value={{ progress, setProgress }}>
      {children}
    </SearchProgressContext.Provider>
  );
}

export function useSearchProgress() {
  const context = useContext(SearchProgressContext);

  if (!context) {
    throw new Error("useSearchProgress must be used within SearchProgressProvider");
  }

  return context;
}
