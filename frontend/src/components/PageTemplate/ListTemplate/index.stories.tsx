import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import ListTemplate from '@components/PageTemplate/ListTemplate';

type StoryItem = {
    url: string;
    name: string;
};

const baseItems: StoryItem[] = [
    { url: 'https://swapi.info/api/people/1', name: 'Luke Skywalker' },
    { url: 'https://swapi.info/api/people/2', name: 'C-3PO' },
    { url: 'https://swapi.info/api/people/3', name: 'R2-D2' },
    { url: 'https://swapi.info/api/people/4', name: 'Darth Vader' },
];

const meta = {
    title: 'Collections/ListTemplate',
    component: ListTemplate<StoryItem>,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Grid list used for browse pages. The documented states cover the most meaningful collection behaviors: populated results, active infinite loading, and the completed browse state.',
            },
        },
    },
    args: {
        items: baseItems,
        entityKey: 'people',
        hasMore: false,
        loadingMore: false,
        onLoadMore: action('load-more'),
        onItemClick: action('item-click'),
    },
} satisfies Meta<typeof ListTemplate<StoryItem>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const LoadingMore: Story = {
    args: {
        hasMore: true,
        loadingMore: true,
    },
};

export const Complete: Story = {
    args: {
        hasMore: false,
        loadingMore: false,
    },
};

export const WithMissingNames: Story = {
    args: {
        items: [
            { url: 'https://swapi.info/api/people/5', name: 'Laia Organa' },
            { url: 'https://swapi.info/api/people/6', name: '' },
            { url: 'https://swapi.info/api/people/7', name: 'Beru Whitesun lars' },
        ],
    },
};
