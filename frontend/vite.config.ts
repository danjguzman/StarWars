import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteAliases } from './config/viteAliases';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: viteAliases,
    },
});
