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
        expect(getEntityImageSources('planets', '1')).toEqual([
            '/assets/img/planets/1.jpg',
            '/assets/img/planets/1.png',
        ]);
        expect(getEntityImageSources('species', '1')).toEqual([
            '/assets/img/species/1.jpg',
            '/assets/img/species/1.png',
        ]);
        expect(getEntityImageSources('vehicles', '1')).toEqual([
            '/assets/img/vehicles/1.jpg',
            '/assets/img/vehicles/1.png',
        ]);
        expect(getEntityImageSources('starships', '1')).toEqual([
            '/assets/img/starships/1.jpg',
            '/assets/img/starships/1.png',
        ]);
    });

    test('returns no candidates for unsupported or missing ids', () => {
        expect(getEntityImageSources('unknown', '1')).toEqual([]);
        expect(getEntityImageSources('', '1')).toEqual([]);
        expect(getEntityImageSources('people', null)).toEqual([]);
    });
});
