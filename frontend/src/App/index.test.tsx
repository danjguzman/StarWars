import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './index';
import { preloadSwapiData } from '@services/preloadService';
import { useFilmsStore } from '@stores/filmsStore';
import { waitForMinimumLoading } from '@utils/loading';

jest.mock('@services/preloadService', () => ({
    preloadSwapiData: jest.fn(),
}));

jest.mock('@stores/filmsStore', () => ({
    useFilmsStore: jest.fn(),
}));

jest.mock('@utils/loading', () => ({
    waitForMinimumLoading: jest.fn(() => Promise.resolve()),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedPreloadSwapiData = jest.mocked(preloadSwapiData);
const mockedUseFilmsStore = jest.mocked(useFilmsStore);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);

function createFilm(id: number, title: string) {
    return {
        title,
        episode_id: id,
        opening_crawl: 'Opening crawl',
        director: 'George Lucas',
        producer: 'Gary Kurtz',
        release_date: '1977-05-25',
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/films/${id}`,
    };
}

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
        window.history.pushState({}, '', '/');
        mockedWaitForMinimumLoading.mockResolvedValue(undefined);
        mockedUseFilmsStore.mockReturnValue({
            films: [createFilm(1, 'A New Hope')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchFilms: jest.fn(async () => undefined),
        } as ReturnType<typeof useFilmsStore>);
    });

    afterEach(async () => {
        await act(async () => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
    });

    test('reveals the real films route after preload succeeds', async () => {
        mockedPreloadSwapiData.mockResolvedValue(undefined);

        renderApp();

        await waitFor(() => expect(mockedPreloadSwapiData).toHaveBeenCalledTimes(1));

        await act(async () => {
            jest.advanceTimersByTime(320);
        });

        expect(await screen.findByRole('heading', { name: 'Films' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open A New Hope' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Go to Films' })).toBeInTheDocument();
        expect(screen.queryByText('Loading Galactic Archives')).not.toBeInTheDocument();
    });

    test('keeps the preloader visible while preload is still waiting on the network', async () => {
        mockedPreloadSwapiData.mockImplementation(() => new Promise(() => undefined));

        renderApp();

        expect(await screen.findByText('Loading Galactic Archives')).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText('Loading Galactic Archives')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Films' })).not.toBeInTheDocument();
    });

    test('shows a retry action when preload fails and recovers back into the real app shell', async () => {
        mockedPreloadSwapiData
            .mockRejectedValueOnce(new Error('The network timed out'))
            .mockResolvedValueOnce(undefined);

        renderApp();

        expect(await screen.findByText(/We couldn't prepare/i)).toBeInTheDocument();

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await user.click(screen.getByRole('button', { name: 'Retry' }));

        expect(screen.queryByText(/We couldn't prepare/i)).not.toBeInTheDocument();
        expect(screen.getByText('Loading Galactic Archives')).toBeInTheDocument();

        await waitFor(() => expect(mockedPreloadSwapiData).toHaveBeenCalledTimes(2));

        await act(async () => {
            jest.advanceTimersByTime(320);
        });

        expect(await screen.findByRole('heading', { name: 'Films' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open A New Hope' })).toBeInTheDocument();
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

        expect(await screen.findByText(/timed out/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Films' })).not.toBeInTheDocument();
    });
});
