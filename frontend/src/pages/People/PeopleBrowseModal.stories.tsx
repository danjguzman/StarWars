import { useEffect, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { Users } from 'phosphor-react';
import Modal from '@components/Modal';
import ListTemplate from '@components/PageTemplate/ListTemplate';
import PageTemplate from '@components/PageTemplate';
import PersonModalContent from '@pages/People/PersonModalContent';
import { type Person } from '@types';
import { PEOPLE_ALL_CACHE_KEY } from '@utils/consts';
import { setCachedValue } from '@utils/clientCache';
import styles from './index.module.css';

const storyShellStyle = {
    minHeight: '100vh',
    padding: '32px',
    background:
        'radial-gradient(circle at top, rgba(255, 183, 0, 0.08), transparent 24%), linear-gradient(180deg, #050505 0%, #0a0f15 100%)',
} satisfies CSSProperties;

const samplePeople: Person[] = [
    {
        name: 'Luke Skywalker',
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
        url: 'https://swapi.info/api/people/1',
    },
    {
        name: 'Leia Organa',
        height: '150',
        mass: '49',
        hair_color: 'brown',
        skin_color: 'light',
        eye_color: 'brown',
        birth_year: '19BBY',
        gender: 'female',
        homeworld: '',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: 'https://swapi.info/api/people/5',
    },
    {
        name: 'Han Solo',
        height: '180',
        mass: '80',
        hair_color: 'brown',
        skin_color: 'fair',
        eye_color: 'brown',
        birth_year: '29BBY',
        gender: 'male',
        homeworld: '',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: 'https://swapi.info/api/people/14',
    },
];

function PeopleBrowseModalStory({ initialIndex = null }: { initialIndex?: number | null }) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(initialIndex);

    useEffect(() => {
        setCachedValue(PEOPLE_ALL_CACHE_KEY, samplePeople, 60_000);
    }, []);

    const selectedPerson = selectedIndex === null ? null : samplePeople[selectedIndex] ?? null;

    return (
        <div style={storyShellStyle}>
            <PageTemplate
                title="People"
                headerIcon={
                    <Box className={styles.pageHeaderIcon}>
                        <Users size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                    </Box>
                }
            >
                <ListTemplate
                    items={samplePeople}
                    entityKey="people"
                    onLoadMore={() => undefined}
                    hasMore={false}
                    loadingMore={false}
                    onItemClick={({ item }) => {
                        const nextIndex = samplePeople.findIndex((person) => person.url === item.url);
                        if (nextIndex >= 0) {
                            setSelectedIndex(nextIndex);
                        }
                    }}
                />

                <Modal
                    opened={selectedPerson !== null}
                    ariaLabel={selectedPerson ? `${selectedPerson.name} details` : 'Person details'}
                    onClose={() => setSelectedIndex(null)}
                    onNavigatePrev={() => {
                        if (selectedIndex === null) return;
                        setSelectedIndex((selectedIndex - 1 + samplePeople.length) % samplePeople.length);
                    }}
                    onNavigateNext={() => {
                        if (selectedIndex === null) return;
                        setSelectedIndex((selectedIndex + 1) % samplePeople.length);
                    }}
                >
                    {selectedPerson && (
                        <PersonModalContent
                            person={selectedPerson}
                            selectedIndex={selectedIndex ?? 0}
                            total={samplePeople.length}
                            onPrev={() => {
                                if (selectedIndex === null) return;
                                setSelectedIndex((selectedIndex - 1 + samplePeople.length) % samplePeople.length);
                            }}
                            onNext={() => {
                                if (selectedIndex === null) return;
                                setSelectedIndex((selectedIndex + 1) % samplePeople.length);
                            }}
                        />
                    )}
                </Modal>
            </PageTemplate>
        </div>
    );
}

const meta = {
    title: 'Flows/PeopleBrowseModal',
    component: PeopleBrowseModalStory,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            story: {
                inline: false,
                iframeHeight: '1180px',
            },
            description: {
                component: 'Interactive people browsing flow that shows the real user path: view the avatar grid, click a character, and open the shared modal successfully. The modal adapts across desktop, compact landscape, and mobile breakpoints, including the shorter-height landscape variants used by the shared modal.',
            },
        },
    },
} satisfies Meta<typeof PeopleBrowseModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ModalOpenDesktop: Story = {
    args: {
        initialIndex: 0,
    },
    globals: {
        viewport: {
            value: 'desktopWide',
            isRotated: false,
        },
    },
};

export const ModalOpenCompactHeight: Story = {
    args: {
        initialIndex: 0,
    },
    globals: {
        viewport: {
            value: 'desktopShort',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the compact-height landscape layout triggered by `(max-height: 939px) and (min-width: 721px)`, where the portrait sits beside the traits card and the previous/next controls align to the outer edges of the modal shell.',
            },
        },
    },
};

export const ModalOpenMobile: Story = {
    args: {
        initialIndex: 0,
    },
    globals: {
        viewport: {
            value: 'mobileTall',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the mobile layout triggered by the `max-width: 720px` CSS breakpoint, matching the in-app modal presentation with the circular portrait, two-column traits card, and full related-action row visible in the viewport.',
            },
        },
    },
};

export const ModalOpenMobileLandscapeS20Ultra: Story = {
    name: 'Modal Open Mobile Landscape (S20 Ultra)',
    args: {
        initialIndex: 0,
    },
    globals: {
        viewport: {
            value: 'mobileLandscapeS20Ultra',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the mobile landscape modal at 915x412, matching the tighter short-height layout used on devices like the Galaxy S20 Ultra.',
            },
        },
    },
};

export const ModalOpenMobileLandscapeProMax: Story = {
    name: 'Modal Open Mobile Landscape (Pro Max)',
    args: {
        initialIndex: 0,
    },
    globals: {
        viewport: {
            value: 'mobileLandscapeProMax',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the mobile landscape modal at 932x430, matching the short-height layout used on larger Pro Max landscape screens.',
            },
        },
    },
};
