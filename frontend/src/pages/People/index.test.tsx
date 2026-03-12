import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import People from '@pages/People';
import { usePeopleStore } from '@stores/peopleStore';
import { getCachedValue } from '@utils/clientCache';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/peopleStore', () => ({
    usePeopleStore: jest.fn(),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedValue: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@components/PageTemplate/ListTemplate', () => ({
    __esModule: true,
    default: ({ items, onItemClick }: { items: Array<{ url: string; name: string }>; onItemClick?: (selection: { item: { url: string; name: string }; label: string }) => void }) => (
        <div>
            {items.map((item) => (
                <button
                    key={item.url}
                    type="button"
                    onClick={() => onItemClick?.({ item, label: item.name })}
                >
                    Open {item.name}
                </button>
            ))}
        </div>
    ),
}));

jest.mock('@pages/People/PersonModalContent', () => ({
    __esModule: true,
    default: ({ person, onPrev, onNext }: { person: { name: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{person.name} content</div>
            <button type="button" onClick={onPrev}>Prev person</button>
            <button type="button" onClick={onNext}>Next person</button>
        </div>
    ),
}));

const mockedUsePeopleStore = jest.mocked(usePeopleStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

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
        homeworld: 'https://swapi.info/api/planets/1',
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
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('People page modal behavior', () => {
    const people = [
        createPerson(1, 'Luke Skywalker'),
        createPerson(2, 'Leia Organa'),
        createPerson(3, 'Han Solo'),
    ];

    beforeEach(() => {
        const fetchPeople = jest.fn();
        mockedUsePeopleStore.mockReturnValue({
            people,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchPeople,
        } as ReturnType<typeof usePeopleStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'people:all' ? people : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderPeoplePage('/people');
        await user.click(screen.getByRole('button', { name: 'Open Luke Skywalker' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/1');
        expect(screen.getByRole('dialog', { name: 'Luke Skywalker details' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people');
    });

    test('uses only the loaded people store list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        const fetchPeople = jest.fn();

        mockedUsePeopleStore.mockReturnValue({
            people: people.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchPeople,
        } as ReturnType<typeof usePeopleStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'people:all' ? people : null));

        renderPeoplePage('/people/1');
        await user.click(screen.getByRole('button', { name: 'Prev person' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/2');
        await user.click(screen.getByRole('button', { name: 'Next person' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/1');
        expect(fetchPeople).not.toHaveBeenCalledWith({ nextPage: true });
    });

    test('shows a retry action when the initial people load fails', async () => {
        const fetchPeople = jest.fn();
        mockedUsePeopleStore.mockReturnValue({
            people: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the People archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchPeople,
        } as ReturnType<typeof usePeopleStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderPeoplePage('/people');

        expect(screen.getByRole('alert', { name: "Couldn't load the People archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading people' }));

        expect(fetchPeople).toHaveBeenCalledWith({ targetCount: 12 });
    });

    test('debounces local search results and opens the selected person modal', async () => {
        jest.useFakeTimers();
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        mockedUsePeopleStore.mockReturnValue({
            people: people.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchPeople: jest.fn(),
        } as ReturnType<typeof usePeopleStore>);
        mockedGetCachedValue.mockReturnValue(null);

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

        expect(screen.getByRole('listbox', { name: 'Search people results' })).toBeInTheDocument();
        expect(screen.getByText('Updating results...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Leia Organa' })).not.toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(250);
        });

        await user.click(await screen.findByRole('button', { name: 'Leia Organa' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/people/2');
        expect(screen.getByRole('dialog', { name: 'Leia Organa details' })).toBeInTheDocument();
    });
});
