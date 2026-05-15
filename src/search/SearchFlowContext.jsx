import { createContext, useContext } from "react";

import { useMobileSearchController } from "./useMobileSearchController";

const SearchFlowContext = createContext(null);

export function SearchFlowProvider({ children }) {
  const searchFlow = useMobileSearchController();

  return <SearchFlowContext.Provider value={searchFlow}>{children}</SearchFlowContext.Provider>;
}

export function useSearchFlow() {
  const searchFlow = useContext(SearchFlowContext);

  if (!searchFlow) {
    throw new Error("useSearchFlow must be used within SearchFlowProvider.");
  }

  return searchFlow;
}
