import type { Meta, StoryObj } from '@storybook/react-vite';
import PreloadState from './PreloadState';

const meta = {
    title: 'App/PreloadState',
    component: PreloadState,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Startup loading state for the full app. These stories let you simulate normal preload, connection loss while loading, and the animated handoff into the main UI.',
            },
        },
    },
} satisfies Meta<typeof PreloadState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const OfflineDuringLoad: Story = {
    args: {
        error: 'Failed to preload Star Wars data.',
    },
};

export const Exiting: Story = {
    args: {
        exiting: true,
    },
};
