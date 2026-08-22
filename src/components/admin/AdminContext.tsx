import React, { createContext, useContext } from 'react';

export const AdminContext = createContext<any>(null);

export const useAdminContext = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminContext must be used within AdminContext.Provider");
  return ctx;
};
