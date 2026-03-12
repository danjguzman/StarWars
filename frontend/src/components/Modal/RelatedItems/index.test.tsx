import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RelatedItems from '@components/Modal/RelatedItems';

function renderWithMantine(ui: ReactNode) {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('RelatedItems', () => {
    test('keeps the bubble decorative when there are no related items', () => {
        renderWithMantine(
            <RelatedItems label="Species" count={0} items={[]} icon={<span>icon</span>} />
        );
        expect(screen.getByText('Species')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /species/i })).not.toBeInTheDocument();
    });

    test('navigates directly when there is exactly one related item', async () => {
        const user = userEvent.setup();
        const onSelectItem = jest.fn();

        renderWithMantine(
            <RelatedItems
                label="Homeworld"
                count={1}
                icon={<span>icon</span>}
                items={[{ url: 'https://swapi.info/api/planets/1', name: 'Tatooine' }]}
                onSelectItem={onSelectItem}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Open Homeworld' }));
        expect(onSelectItem).toHaveBeenCalledWith({ url: 'https://swapi.info/api/planets/1', name: 'Tatooine' });
    });

    test('opens a menu for multiple related items and navigates to the selected resource', async () => {
        const user = userEvent.setup();
        const onSelectItem = jest.fn();

        renderWithMantine(
            <RelatedItems
                label="Films"
                count={2}
                icon={<span>icon</span>}
                items={[
                    { url: 'https://swapi.info/api/films/1', name: 'A New Hope' },
                    { url: 'https://swapi.info/api/films/2', name: 'The Empire Strikes Back' },
                ]}
                onSelectItem={onSelectItem}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Show Films' }));
        await user.click(await screen.findByText('The Empire Strikes Back'));
        expect(onSelectItem).toHaveBeenCalledWith({
            url: 'https://swapi.info/api/films/2',
            name: 'The Empire Strikes Back',
        });
    });
});
