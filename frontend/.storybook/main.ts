import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-viewport'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
    async viteFinal(config) {
        return mergeConfig(config, {
            resolve: {
                alias: {
                    '@components': '/src/components',
                    '@pages': '/src/pages',
                    '@services': '/src/services',
                    '@stores': '/src/stores',
                    '@types': '/src/types',
                    '@utils': '/src/utils',
                },
            },
        });
    },
};

export default config;
