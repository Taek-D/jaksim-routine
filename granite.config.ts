import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "jaksim-routine",
  brand: {
    displayName: "작심루틴",
    primaryColor: "#4CAF50",
    icon: "https://yidyxlwrongecctifiis.supabase.co/storage/v1/object/public/assets/logo.png",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [],
});
