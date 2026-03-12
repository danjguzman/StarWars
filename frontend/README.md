# React + TypeScript + Vite

## Setup & Run Instructions

### Run the app
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open the local URL shown in the terminal.
4. Browse sections like Films, People, Planets, Species, Vehicles, and Starships.
5. Click any item to open its modal to view details.

### Run Jest + React Testing Library
1. Run the full test suite:
   ```bash
   npm test
   ```
2. Run tests in watch mode:
   ```bash
   npm run test:watch
   ```
3. Run a specific test file:
   ```bash
   npm test -- src/pages/People/index.test.tsx --runInBand
   ```

### Run Storybook
1. Start Storybook:
   ```bash
   npm run storybook
   ```
2. Open:
   ```text
   http://localhost:6006
   ```
3. Use Storybook to review isolated components, loading/error states, modal layouts, and responsive behavior.
4. Build the static Storybook output:
   ```bash
   npm run build-storybook
   ```
