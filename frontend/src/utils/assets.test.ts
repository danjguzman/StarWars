import { getEntityImageSources } from '@utils/assets';

describe('getEntityImageSources', () => {
    test('returns jpg and png candidates for supported image categories', () => {
        expect(getEntityImageSources('films', '1')).toEqual([
            '/assets/img/films/1.jpg',
            '/assets/img/films/1.png',
        ]);
        expect(getEntityImageSources('people', '1')).toEqual([
            '/assets/img/people/1.jpg',
            '/assets/img/people/1.png',
        ]);
    });

    test('returns no candidates for categories without bundled image assets', () => {
        expect(getEntityImageSources('planets', '1')).toEqual([]);
        expect(getEntityImageSources('species', '1')).toEqual([]);
        expect(getEntityImageSources('vehicles', '1')).toEqual([]);
        expect(getEntityImageSources('starships', '1')).toEqual([]);
    });
});
