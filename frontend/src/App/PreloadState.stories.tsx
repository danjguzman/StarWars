import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import PreloadState from './PreloadState';

function SimulatedPreloadState({
    initialError = null,
    failureDelayMs,
    failureMessage,
}: {
    initialError?: string | null;
    failureDelayMs?: number;
    failureMessage: string;
}) {
    const retryAction = fn();
    const [attempt, setAttempt] = useState(0);
    const [error, setError] = useState<string | null>(initialError);

    useEffect(() => {
        if (failureDelayMs === undefined) return undefined;

        setError(null);

        const timeoutId = window.setTimeout(() => {
            setError(failureMessage);
        }, failureDelayMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [attempt, failureDelayMs, failureMessage]);

    return (
        <PreloadState
            error={error}
            onRetry={() => {
                retryAction();
                setError(null);
                setAttempt((current) => current + 1);
            }}
        />
    );
}

function SimulatedLoadingExitState({ exitDelayMs }: { exitDelayMs: number }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setExiting(true);
        }, exitDelayMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [exitDelayMs]);

    return <PreloadState exiting={exiting} />;
}

const meta = {
    title: 'App/PreloadState',
    component: PreloadState,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Startup loading state for the full app. These stories let you review steady loading, slow-connection waiting, retryable preload failures, and the animated handoff into the main UI.',
            },
        },
    },
} satisfies Meta<typeof PreloadState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingAndExiting: Story = {
    name: 'Loading & Exiting',
    render: function LoadingAndExitingStory() {
        return <SimulatedLoadingExitState exitDelayMs={5000} />;
    },
    parameters: {
        docs: {
            description: {
                story: 'Starts in the normal loading state, then switches into the exit animation after 5 seconds.',
            },
        },
    },
};

export const SlowConnection: Story = {
    name: 'Loading with Slow Connection + Retry',
    render: function SlowConnectionStory() {
        return (
            <SimulatedPreloadState
                failureDelayMs={5000}
                failureMessage="We couldn't prepare the Star Wars archive. The request took too long and timed out."
            />
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'Starts as a loading preloader, then flips into a retryable timeout failure after 5 seconds so you can review the waiting-to-error transition directly in Storybook.',
            },
        },
    },
};
