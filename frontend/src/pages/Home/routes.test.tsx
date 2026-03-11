import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { homeRoutes } from '@pages/Home/routes';
import { MemoryRouter, Routes } from 'react-router-dom';

jest.mock('@pages/Films', () => ({
    __esModule: true,
    default: () => <div>Films page</div>,
}));

jest.mock('@pages/Planets', () => ({
    __esModule: true,
    default: () => <div>Planets page</div>,
}));

jest.mock('@pages/Species', () => ({
    __esModule: true,
    default: () => <div>Species page</div>,
}));

jest.mock('@pages/Vehicles', () => ({
    __esModule: true,
    default: () => <div>Vehicles page</div>,
}));

jest.mock('@pages/Starships', () => ({
    __esModule: true,
    default: () => <div>Starships page</div>,
}));

jest.mock('@pages/People', () => ({
    __esModule: true,
    default: () => <div>People page</div>,
}));

jest.mock('@mantine/hooks', () => ({
    ...jest.requireActual('@mantine/hooks'),
    useMediaQuery: jest.fn(() => false),
}));

function renderHomeRoutes(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>{homeRoutes}</Routes>
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('homeRoutes', () => {
    const originalScrollTo = window.scrollTo;

    beforeEach(() => {
        window.scrollTo = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
        window.scrollTo = originalScrollTo;
    });

    test('loads the matching section page after clicking a header route', async () => {
        const user = userEvent.setup();
        renderHomeRoutes('/');
        await user.click(screen.getByRole('link', { name: 'Films' }));
        expect(await screen.findByText('Films page')).toBeInTheDocument();
    });

    test('renders the section page for a detail route', () => {
        renderHomeRoutes('/films/1');
        expect(screen.getByText('Films page')).toBeInTheDocument();
    });

    test('renders the planets browse page for a detail route', () => {
        renderHomeRoutes('/planets/1');
        expect(screen.getByText('Planets page')).toBeInTheDocument();
    });

    test('renders the species browse page for a detail route', () => {
        renderHomeRoutes('/species/1');
        expect(screen.getByText('Species page')).toBeInTheDocument();
    });

    test('renders the vehicles browse page for a detail route', () => {
        renderHomeRoutes('/vehicles/1');
        expect(screen.getByText('Vehicles page')).toBeInTheDocument();
    });

    test('renders the starships browse page for a detail route', () => {
        renderHomeRoutes('/starships/1');
        expect(screen.getByText('Starships page')).toBeInTheDocument();
    });

    test('remounts the top-level page immediately when switching sections', async () => {
        const user = userEvent.setup();

        renderHomeRoutes('/films');
        expect(screen.getByText('Films page')).toBeInTheDocument();

        await user.click(screen.getByRole('link', { name: 'People' }));

        expect(await screen.findByText('People page')).toBeInTheDocument();
        expect(screen.queryByText('Films page')).not.toBeInTheDocument();
    });

    test('scrolls back to the top when moving between top-level pages', async () => {
        const user = userEvent.setup();

        renderHomeRoutes('/films');
        await user.click(screen.getByRole('link', { name: 'Planets' }));

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    });

    test('shows the NotFound component for an unknown route', () => {
        renderHomeRoutes('/this-route-does-not-exist');
        expect(screen.getByRole('heading', { name: 'Not Found' })).toBeInTheDocument();
        expect(screen.getByText('The page you entered does not exist.')).toBeInTheDocument();
    });
});
