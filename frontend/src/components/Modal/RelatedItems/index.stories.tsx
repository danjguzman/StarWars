import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilmReelIcon } from '@phosphor-icons/react';
import RelatedItems from '@components/Modal/RelatedItems';

const meta = {
    title: 'Modal/RelatedItems',
    component: RelatedItems,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Relationship shortcut used at the bottom of detail modals. The stories show the three meaningful states: decorative empty, direct navigation for one item, and menu-driven navigation for many items.',
            },
        },
    },
    args: {
        label: 'Films',
        count: 0,
        icon: <FilmReelIcon size={28} weight="duotone" />,
        items: [],
    },
} satisfies Meta<typeof RelatedItems>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const SingleLink: Story = {
    args: {
        label: 'Homeworld',
        count: 1,
        items: [{ url: 'https://swapi.info/api/planets/1', name: 'Tatooine' }],
    },
};

export const MenuOfLinks: Story = {
    args: {
        count: 3,
        items: [
            { url: 'https://swapi.info/api/films/1', name: 'A New Hope' },
            { url: 'https://swapi.info/api/films/2', name: 'The Empire Strikes Back' },
            { url: 'https://swapi.info/api/films/3', name: 'Return of the Jedi' },
        ],
    },
};
