import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import App from './index';
import { preloadSwapiData } from '@services/preloadService';
import { waitForMinimumLoading } from '@utils/loading';

jest.mock('@services/preloadService', () => ({
    preloadSwapiData: jest.fn(),
}));

jest.mock('@utils/loading', () => ({
    waitForMinimumLoading: jest.fn(() => Promise.resolve()),
}));

jest.mock('@pages/Home/routes', () => ({
    homeRoutes: <div data-testid="home-routes">Home routes</div>,
}));

jest.mock('react-router-dom', () => ({
    BrowserRouter: ({ children }: { children: ReactNode }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }: { children: ReactNode }) => <div data-testid="routes">{children}</div>,
}));

const mockedPreloadSwapiData = jest.mocked(preloadSwapiData);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);

function renderApp() {
    return render(
        <MantineProvider>
            <App />
        </MantineProvider>
    );
}

describe('App preload flow', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockedWaitForMinimumLoading.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('reveals the app after preload succeeds', async () => {
        mockedPreloadSwapiData.mockResolvedValue(undefined);

        renderApp();

        await waitFor(() => expect(mockedPreloadSwapiData).toHaveBeenCalledTimes(1));

        await act(async () => {
            jest.advanceTimersByTime(320);
        });

        expect(await screen.findByTestId('home-routes')).toBeInTheDocument();
    });

    test('keeps the preloader visible while preload is still waiting on the network', async () => {
        mockedPreloadSwapiData.mockImplementation(() => new Promise(() => undefined));

        renderApp();

        expect(await screen.findByText('Loading Galactic Archives')).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry preload' })).not.toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText('Loading Galactic Archives')).toBeInTheDocument();
        expect(screen.queryByTestId('home-routes')).not.toBeInTheDocument();
    });

    test('shows a retry action when preload fails and recovers on retry', async () => {
        mockedPreloadSwapiData
            .mockRejectedValueOnce(new Error('The network timed out'))
            .mockResolvedValueOnce(undefined);

        renderApp();

        expect(await screen.findByText(/We couldn't prepare the Star Wars archive/i)).toBeInTheDocument();

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await user.click(screen.getByRole('button', { name: 'Retry preload' }));

        expect(screen.queryByText(/We couldn't prepare the Star Wars archive/i)).not.toBeInTheDocument();
        expect(screen.getByText('Loading Galactic Archives')).toBeInTheDocument();

        await waitFor(() => expect(mockedPreloadSwapiData).toHaveBeenCalledTimes(2));

        await act(async () => {
            jest.advanceTimersByTime(320);
        });

        expect(await screen.findByTestId('home-routes')).toBeInTheDocument();
    });

    test('shows a retryable error after a delayed preload timeout', async () => {
        mockedPreloadSwapiData.mockImplementation(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('The Star Wars API timed out after 15 seconds')), 15000);
        }));

        renderApp();

        expect(await screen.findByText('Loading Galactic Archives')).toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(15000);
        });

        expect(await screen.findByText(/The Star Wars API timed out after 15 seconds/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry preload' })).toBeInTheDocument();
    });
});
