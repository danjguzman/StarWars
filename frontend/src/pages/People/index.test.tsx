import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import People from '@pages/People';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useModalStackStore } from '@stores/modalStackStore';
import { usePeopleStore } from '@stores/peopleStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore, type HookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/peopleStore', () => ({
    usePeopleStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUsePeopleStore = jest.mocked(usePeopleStore);

type PeopleStoreState = {
    people: ReturnType<typeof createPerson>[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: 'initial' | 'nextPage' | null;
    hasMore: boolean;
    fetchPeople: jest.Mock<Promise<void>, [options?: { nextPage?: boolean; targetCount?: number }]>;
};

function createPerson(id: number, name: string) {
    return {
        name,
        height: '172',
        mass: '77',
        hair_color: 'blond',
        skin_color: 'fair',
        eye_color: 'blue',
        birth_year: '19BBY',
        gender: 'male',
        homeworld: '',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/people/${id}`,
    };
}

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderPeoplePage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/people" element={<People />} />
                    <Route path="/people/:personId" element={<People />} />
                </Routes>
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('People page behavior', () => {
    const people = [
        createPerson(1, 'Luke Skywalker'),
        createPerson(2, 'Leia Organa'),
        createPerson(3, 'Han Solo'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('opens the real person modal from the grid and cycles through loaded people', async () => {
        const peopleStore = createHookStore<PeopleStoreState>({
            people,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchPeople: jest.fn(async () => undefined),
        });
        mockedUsePeopleStore.mockImplementation(() => peopleStore.useStore());

        const user = userEvent.setup();
        renderPeoplePage('/people');

        await user.click(screen.getByRole('button', { name: 'Open Luke Skywalker' }));

        const personDialog = await screen.findByRole('dialog', { name: 'Luke Skywalker details' });
        expect(within(personDialog).getByText('Height')).toBeInTheDocument();
        expect(within(personDialog).getByText('Luke Skywalker')).toBeInTheDocument();
        expect(within(personDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        expect(await screen.findByRole('dialog', { name: 'Han Solo details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'Luke Skywalker details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/1');
    });

    test('shows an error alert and recovers back to the real people grid after retry', async () => {
        let skipInitialRequest = true;
        let peopleStore: HookStore<PeopleStoreState>;
        const fetchPeople = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            peopleStore.setState((currentState) => ({
                ...currentState,
                people,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        peopleStore = createHookStore<PeopleStoreState>({
            people: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the People archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchPeople,
        });
        mockedUsePeopleStore.mockImplementation(() => peopleStore.useStore());

        const user = userEvent.setup();
        renderPeoplePage('/people');

        expect(await screen.findByRole('alert', { name: "Couldn't load the People archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading people' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the People archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open Luke Skywalker' })).toBeInTheDocument();
    });

    test('debounces search results, shows the empty state, and opens the selected person', async () => {
        jest.useFakeTimers();
        const peopleStore = createHookStore<PeopleStoreState>({
            people: people.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchPeople: jest.fn(async () => undefined),
        });
        mockedUsePeopleStore.mockImplementation(() => peopleStore.useStore());

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        renderPeoplePage('/people');

        await user.type(screen.getByRole('textbox', { name: 'Search people' }), 'han');

        expect(screen.getByRole('listbox', { name: 'Search people results' })).toBeInTheDocument();
        expect(screen.getByText('Updating results...')).toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(250);
        });

        expect(await screen.findByRole('listbox', { name: 'Search people results' })).toBeInTheDocument();
        expect(screen.getByText('No matching people loaded on this page yet.')).toBeInTheDocument();

        await user.clear(screen.getByRole('textbox', { name: 'Search people' }));
        await user.type(screen.getByRole('textbox', { name: 'Search people' }), 'lei');

        expect(screen.getByText('Updating results...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Leia Organa' })).not.toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(250);
        });

        await user.click(await screen.findByRole('button', { name: 'Leia Organa' }));

        expect(screen.queryByRole('listbox', { name: 'Search people results' })).not.toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/2');
        expect(await screen.findByRole('dialog', { name: 'Leia Organa details' })).toBeInTheDocument();
    });
});
