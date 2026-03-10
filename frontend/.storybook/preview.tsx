import type { Preview } from '@storybook/react';
import type { ViewportMap } from '@storybook/addon-viewport';
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import globalStyles from '../src/index.module.css';
import { MemoryRouter } from 'react-router-dom';

void globalStyles;

const theme = createTheme({
    primaryColor: 'yellow',
});

const customViewports = {
    desktopWide: {
        name: 'Desktop Wide',
        styles: {
            width: '1440px',
            height: '1100px',
        },
    },
    desktopShort: {
        name: 'Desktop Short',
        styles: {
            width: '1440px',
            height: '880px',
        },
    },
    mobileTall: {
        name: 'Mobile Tall',
        styles: {
            width: '390px',
            height: '844px',
        },
    },
} satisfies ViewportMap;

const preview: Preview = {
    initialGlobals: {
        viewport: {
            value: 'desktopWide',
            isRotated: false,
        },
    },
    decorators: [
        (Story) => (
            <MemoryRouter>
                <MantineProvider theme={theme} forceColorScheme="dark">
                    <Story />
                </MantineProvider>
            </MemoryRouter>
        ),
    ],
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'space',
            values: [
                { name: 'space', value: '#050505' },
                { name: 'panel', value: '#10151c' },
            ],
        },
        controls: {
            expanded: true,
        },
        viewport: {
            options: customViewports,
        },
    },
};

export default preview;
