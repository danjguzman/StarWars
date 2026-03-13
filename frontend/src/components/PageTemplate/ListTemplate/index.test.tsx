import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListTemplate from '@components/PageTemplate/ListTemplate';
import { useInfiniteScroll } from '@utils/useInfiniteScroll';

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

jest.mock('@components/InfiniteScrollSentinel', () => ({
    __esModule: true,
    default: ({ onDoneClick, doneAriaLabel, showDone }: { onDoneClick?: () => void; doneAriaLabel?: string; showDone: boolean }) => {
        if (!showDone) return <div data-testid="infinite-scroll-sentinel" />;
        return <button aria-label={doneAriaLabel} onClick={onDoneClick}>Done</button>;
    },
}));

const mockedUseInfiniteScroll = jest.mocked(useInfiniteScroll);

function renderWithMantine(ui: ReactNode) {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('ListTemplate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseInfiniteScroll.mockReturnValue({ current: null });
        window.scrollTo = jest.fn();
    });

    test('falls back to Unknown labels and supports click and keyboard selection', async () => {
        const user = userEvent.setup();
        const onItemClick = jest.fn();
        const items = [
            { url: 'https://swapi.info/api/people/1', name: 'Luke Skywalker' },
            { url: 'https://swapi.info/api/people/2', name: '' },
        ];

        renderWithMantine(
            <ListTemplate
                items={items}
                entityKey="people"
                onLoadMore={jest.fn()}
                hasMore
                loadingMore={false}
                onItemClick={onItemClick}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Open Luke Skywalker' }));
        screen.getByRole('button', { name: 'Open Unknown' }).focus();
        await user.keyboard('{Enter}');

        expect(screen.getByText('Unknown')).toBeInTheDocument();
        expect(onItemClick).toHaveBeenNthCalledWith(1, {
            item: items[0],
            label: 'Luke Skywalker',
        });
        expect(onItemClick).toHaveBeenNthCalledWith(2, {
            item: items[1],
            label: 'Unknown',
        });
    });

    test('tries png assets before falling back and wires the done button to scroll to top', async () => {
        const user = userEvent.setup();
        const items = [{ url: 'https://swapi.info/api/people/1', name: 'Luke Skywalker' }];

        renderWithMantine(
            <ListTemplate
                items={items}
                entityKey="people"
                onLoadMore={jest.fn()}
                hasMore={false}
                loadingMore={false}
            />
        );

        const portrait = screen.getByAltText('Luke Skywalker portrait');
        expect(portrait).toBeInTheDocument();
        fireEvent.error(portrait);

        expect(screen.getByAltText('Luke Skywalker portrait')).toHaveAttribute('src', '/assets/img/people/1.png');

        fireEvent.error(screen.getByAltText('Luke Skywalker portrait'));

        await waitFor(() => {
            expect(screen.queryByAltText('Luke Skywalker portrait')).not.toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Scroll to top' }));
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('loads film artwork from png when jpg is unavailable', () => {
        const items = [{ url: 'https://swapi.info/api/films/1', title: 'A New Hope' }];

        renderWithMantine(
            <ListTemplate
                items={items}
                entityKey="films"
                labelKey="title"
                onLoadMore={jest.fn()}
                hasMore={false}
                loadingMore={false}
            />
        );

        const artwork = screen.getByAltText('A New Hope portrait');
        expect(artwork).toHaveAttribute('src', '/assets/img/films/1.jpg');

        fireEvent.error(artwork);

        expect(screen.getByAltText('A New Hope portrait')).toHaveAttribute('src', '/assets/img/films/1.png');
    });

    test('keeps portraits hidden until they finish loading so missing images never flash alt text', () => {
        const items = [{ url: 'https://swapi.info/api/people/1', name: 'Luke Skywalker' }];

        renderWithMantine(
            <ListTemplate
                items={items}
                entityKey="people"
                onLoadMore={jest.fn()}
                hasMore={false}
                loadingMore={false}
            />
        );

        const portrait = screen.getByAltText('Luke Skywalker portrait');
        expect(portrait).toHaveAttribute('data-loaded', 'false');
        expect(portrait).toHaveClass('avatarImageHidden');

        fireEvent.load(portrait);

        expect(portrait).toHaveAttribute('data-loaded', 'true');
        expect(portrait).not.toHaveClass('avatarImageHidden');
    });

});
