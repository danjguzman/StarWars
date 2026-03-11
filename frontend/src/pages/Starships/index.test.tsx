import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarshipsPage from '@pages/Starships';
import { useStarshipsStore } from '@stores/starshipsStore';
import { getCachedValue } from '@utils/clientCache';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/starshipsStore', () => ({
    useStarshipsStore: jest.fn(),
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

jest.mock('@pages/Starships/StarshipModalContent', () => ({
    __esModule: true,
    default: ({ starship, onPrev, onNext }: { starship: { name: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{starship.name} content</div>
            <button type="button" onClick={onPrev}>Prev starship</button>
            <button type="button" onClick={onNext}>Next starship</button>
        </div>
    ),
}));

const mockedUseStarshipsStore = jest.mocked(useStarshipsStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

function createStarship(id: number, name: string) {
    return {
        name,
        model: 'Model Name',
        manufacturer: 'Corellia Inc',
        cost_in_credits: '100000',
        length: '150',
        max_atmosphering_speed: '1050',
        crew: '4',
        passengers: '6',
        cargo_capacity: '50000',
        consumables: '2 months',
        hyperdrive_rating: '2.0',
        MGLT: '70',
        starship_class: 'corvette',
        pilots: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/starships/${id}`,
    };
}

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderStarshipsPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/starships" element={<StarshipsPage />} />
                    <Route path="/starships/:starshipId" element={<StarshipsPage />} />
                </Routes>
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Starships page modal behavior', () => {
    const starships = [
        createStarship(1, 'CR90 corvette'),
        createStarship(2, 'Star Destroyer'),
        createStarship(3, 'Millennium Falcon'),
    ];

    beforeEach(() => {
        const fetchStarships = jest.fn();
        mockedUseStarshipsStore.mockReturnValue({
            starships,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchStarships,
        } as ReturnType<typeof useStarshipsStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'starships:all' ? starships : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderStarshipsPage('/starships');

        await user.click(screen.getByRole('button', { name: 'Open CR90 corvette' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/1');
        expect(screen.getByRole('dialog', { name: 'CR90 corvette details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships');
    });

    test('uses the cached starships list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        renderStarshipsPage('/starships/1');

        await user.click(screen.getByRole('button', { name: 'Prev starship' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/3');

        await user.click(screen.getByRole('button', { name: 'Next starship' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/1');
    });

    test('shows a retry action when the initial starships load fails', async () => {
        const fetchStarships = jest.fn();
        mockedUseStarshipsStore.mockReturnValue({
            starships: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Starships archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchStarships,
        } as ReturnType<typeof useStarshipsStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderStarshipsPage('/starships');

        expect(screen.getByRole('alert', { name: "Couldn't load the Starships archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading starships' }));

        expect(fetchStarships).toHaveBeenCalledWith({ targetCount: 12 });
    });
});
