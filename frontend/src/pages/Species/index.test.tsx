import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeciesPage from '@pages/Species';
import { useSpeciesStore } from '@stores/speciesStore';
import { getCachedValue } from '@utils/clientCache';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/speciesStore', () => ({
    useSpeciesStore: jest.fn(),
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

jest.mock('@pages/Species/SpeciesModalContent', () => ({
    __esModule: true,
    default: ({ species, onPrev, onNext }: { species: { name: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{species.name} content</div>
            <button type="button" onClick={onPrev}>Prev species</button>
            <button type="button" onClick={onNext}>Next species</button>
        </div>
    ),
}));

const mockedUseSpeciesStore = jest.mocked(useSpeciesStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

function createSpecies(id: number, name: string) {
    return {
        name,
        classification: 'mammal',
        designation: 'sentient',
        average_height: '180',
        skin_colors: 'fair',
        hair_colors: 'brown',
        eye_colors: 'blue',
        average_lifespan: '120',
        homeworld: 'https://swapi.info/api/planets/1',
        language: 'Galactic Basic',
        people: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/species/${id}`,
    };
}

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderSpeciesPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/species" element={<SpeciesPage />} />
                    <Route path="/species/:speciesId" element={<SpeciesPage />} />
                </Routes>
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Species page modal behavior', () => {
    const species = [
        createSpecies(1, 'Human'),
        createSpecies(2, 'Wookiee'),
        createSpecies(3, 'Droid'),
    ];

    beforeEach(() => {
        const fetchSpecies = jest.fn();
        mockedUseSpeciesStore.mockReturnValue({
            species,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchSpecies,
        } as ReturnType<typeof useSpeciesStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'species:all' ? species : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderSpeciesPage('/species');

        await user.click(screen.getByRole('button', { name: 'Open Human' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/1');
        expect(screen.getByRole('dialog', { name: 'Human details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/species');
    });

    test('uses the cached species list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        renderSpeciesPage('/species/1');

        await user.click(screen.getByRole('button', { name: 'Prev species' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/3');

        await user.click(screen.getByRole('button', { name: 'Next species' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/1');
    });

    test('shows a retry action when the initial species load fails', async () => {
        const fetchSpecies = jest.fn();
        mockedUseSpeciesStore.mockReturnValue({
            species: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Species archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchSpecies,
        } as ReturnType<typeof useSpeciesStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderSpeciesPage('/species');

        expect(screen.getByRole('alert', { name: "Couldn't load the Species archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading species' }));

        expect(fetchSpecies).toHaveBeenCalledWith({ targetCount: 12 });
    });
});
