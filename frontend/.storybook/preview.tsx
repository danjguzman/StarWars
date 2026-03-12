import type { Preview } from '@storybook/react';
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import globalStyles from '../src/index.module.css';
import { MemoryRouter } from 'react-router-dom';

void globalStyles;

type StoryViewportMap = Record<string, {
    name: string;
    styles: {
        width: string;
        height: string;
    };
}>;

const theme = createTheme({
    primaryColor: 'yellow',
});

const customViewports = {
    responsive: {
        name: 'Responsive',
        styles: {
            width: '100%',
            height: '100%',
        },
    },
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
            height: '932px',
        },
    },
    mobileLandscapeS20Ultra: {
        name: 'Mobile Landscape S20 Ultra',
        styles: {
            width: '915px',
            height: '412px',
        },
    },
    mobileLandscapeProMax: {
        name: 'Mobile Landscape Pro Max',
        styles: {
            width: '932px',
            height: '430px',
        },
    },
} satisfies StoryViewportMap;

const preview: Preview = {
    initialGlobals: {
        viewport: {
            value: 'responsive',
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
