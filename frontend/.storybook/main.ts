import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { viteAliases } from '../config/viteAliases.ts';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
    async viteFinal(config) {
        return mergeConfig(config, {
            cacheDir: 'node_modules/.vite-storybook',
            resolve: {
                alias: viteAliases,
            },
        });
    },
};

export default config;
