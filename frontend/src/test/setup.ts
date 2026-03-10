import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

if (!globalThis.TextEncoder) {
    Object.defineProperty(globalThis, 'TextEncoder', {
        writable: true,
        configurable: true,
        value: TextEncoder,
    });
}

if (!globalThis.TextDecoder) {
    Object.defineProperty(globalThis, 'TextDecoder', {
        writable: true,
        configurable: true,
        value: TextDecoder,
    });
}

if (typeof window !== 'undefined' && !window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

if (!globalThis.ResizeObserver) {
    class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    Object.defineProperty(globalThis, 'ResizeObserver', {
        writable: true,
        configurable: true,
        value: ResizeObserverMock,
    });
}

if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = jest.fn();
}

if (!window.scrollTo) {
    Object.defineProperty(window, 'scrollTo', {
        writable: true,
        value: jest.fn(),
    });
}
