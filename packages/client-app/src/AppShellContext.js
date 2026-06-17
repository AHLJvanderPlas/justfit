import { createContext, useContext } from "react";

export const AppShellContext = createContext(null);
export const useAppShell = () => useContext(AppShellContext);
