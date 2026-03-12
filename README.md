# Star Wars Explorer

The Star Wars Explorer is an interactive viewer for exploring information about films, people, planets, species, vehicles, and starships from the Star Wars universe using SWAPI. It allows users to browse core entity types and view related details in a simple, responsive interface.

## Architecture Overview

I kept the architecture pretty simple and separated by purpose. Pages and routes handle navigation, components handle shared UI, services handle API calls, stores handle shared state, and types keep the SWAPI data shapes organized. The main goal was to keep fetch logic and state logic out of components so the app stayed cleaner and easier to manage and scale.

### Key Decisions

The key decisions I made were to use Zustand for state management, keep API calls in a service layer, and organize the project by responsibility instead of mixing logic together. I also split pages and stores by entity type, kept shared UI in reusable components, and centralized types so the SWAPI data stayed consistent across the app.

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

## State Management

### Chosen Solution

Zustand.

### Why I Chose It

I chose Zustand because it fits naturally into React’s hook-based model. It has a clean, low-abstraction API, requires no providers, and keeps state management simple and direct. You can import a store and use it like a React hook, which makes it feel straightforward and easy to work with.

### Alternatives Considered

I considered MobX, since the first interview mentioned it was already in use, but after reviewing how it works, it felt less aligned with the simpler, hook-based React style I wanted for this project. I have not personally used MobX before, so I may not have seen all of its strengths.

### Tradeoffs

From what I could tell, MobX may offer a more structured and automatic approach to state management, while Zustand is simpler, clearer, and easier for me to work with. This is my impression based on research.

## AI in My Workflow

### How I Used AI

I used AI extensively after I first designed the structure and scaffolded the base code with components, CSS, services, routes, and stores, along with modals, infinite scrolling, and mobile views. Once that base was in place, I cleaned it up manually, which was quicker and cheaper than prompting, and made sure the code stayed as clean, concise, and stylistically consistent as possible. I also added comments above relevant blocks of code, since they help both with readability and with guiding AI when generating or updating those sections.

Once I had the base app working, including the layout, pages, services, and actual hover and click behavior, I started prompting changes based on my own QA of the app. That ended up being a lot of UI and UX refinement, mobile restyling, testing infinite scrolling, checking how the app behaved when loading more data, verifying cached versus expired cached data, and paying close attention to the item viewer modals in both desktop and mobile views.

After the cleanup on the base code and the initial features, I used that first page as the pattern for the rest. Since a lot of the work had already been componentized, it was fairly straightforward to build out the remaining pages quickly and with minimal issues.

### What I Verified Myself

I always review the code AI generates in GitHub Desktop so I can inspect the diffs before committing anything. I try to commit after significant changes, but I also make smaller commits when the work clearly shifts to a different subject. Overall, I try to keep commits focused and on topic.

I also review the test files and Storybook stories it generates, especially to make sure they are actually testing or showing the right things. AI tends to assume it handled everything correctly, and when I push back, it usually starts with the usual “You’re right...” before sometimes making it worse. 

But with giving it a bit of an attitude adjustment, it'll get back on track. :)

## Some Challenges Faced

### Challenge 1

**Problem:** 

SWAPI Data. 

The SWAPI.info URL provided in the test does not support paging, filtering, or searching. I asked all the AI overlords what params to use for the endpoints for those features, but they all gave me answers for other SWAPI services, not the one used in the Take-Home Assignment. I pushed back, and they all eventually agreed SWAPI.info does not support params.

That kind of wrecked my original idea. But I did come up with a solution.

**Resolution:** 

I had to improvise since I built a UI that links relationships between each of those categories, and otherwise it would not have worked the way I intended.

My original idea was to preload all of the data, like I would in any app built around this kind of static data viewer, and then build a simple system to keep that data cached for 5 minutes before it expired.

Basically, I ended up creating my own API-like layer through caching while still using the actual remote data. That helped a lot with Infinite Scrolling, since SWAPI.info could not support it on its own.

How it works:

* The initial preload gets saved into the stores by category.
* That data also gets added to cache under keys like `people:all`, so the full dataset stays available.
* There is also a temp cache that holds chunked slices of that data, which act like fake "pages" and only get set during Infinite Scroll.
* Infinite Scroll reads from the main cache, the cache module chunks that data into a temp cache for the requested page, and then Infinite Scroll just runs its normal flow of loading, showing a spinner, and displaying the results when done.

If the API had supported params, I probably would have built this differently.

### Challenge 2

**Problem:** 

To make the UI feel more interactive, or alive, I used CSS animations and transitions to give it a bit more glamour. I had the AI follow my instructions on what to implement, but as usual, it made a lot of assumptions about what I wanted without clearly giving me exactly what I asked for in the first place.

AI loves to default to `requestAnimationFrame` or `setInterval` for JS-based animations. That caused performance issues and made debugging harder because when I asked why a transition was not working as expected, it would add another transition but still leave the `requestAnimationFrame` in place, which only created more problems.

Even worse, it did not use animation events to trigger other events. It just timed things itself to match `requestAnimationFrame`.

I was not a merry man.

**Resolution:** 

The solution was pretty obvious. I had to make it undo all of the JS animations and convert them to CSS animations instead. I had already done a couple manually, so I just told it to follow that pattern. I noticed in my initial scaffolding I had not written any animations at all, so it had improvised on its own, even though it was mostly cloning my existing code style everywhere else.

The biggest fix, though, was how it handled the end of animations. When it used `requestAnimationFrame`, it kept trying to catch the right frame to stop an animation and trigger the next event, and that often made things like modals or page switching feel janky and buggy. I had to direct it to use things like `onTransitionEnd` on elements so it could watch for the actual CSS transition finishing before triggering a function, instead of trying to guess the timing on its own.

That solved the janky animations and the performance issues.

Those were probably the biggest issues I ran into. After that, it was mostly smooth aside from a few hiccups while building the modals and the AI still managing to get some basic things wrong.

## Future Improvements

I would have liked most of the improvements to come from the SWAPI itself by adding params. If I were part of the team and we were working on a real project, I would be specific about what I needed to match the features the frontend requires, both in the params and in the data shape. In this case though, I could not do that.

On the frontend side, I probably would have liked to push the design further. I am not a designer, so I had to come up with this one in a very pantser way. The UI took up a pretty good chunk of the time, but normally I would be working from a provided design in the task, which would have made the overall development time quicker.

That also rolls into the modals, which I would have liked to improve more as well. They serve their function, and I tried to give them a design that adds a bit of Star Wars theme to the app. While they look good on larger screens, I had to make some more significant changes for smaller screens like mobile devices. But for what it is, and for the time I had, it turned out well.

As for images, I only got the Films and People images, for the rest, I don't know enough about Star Wars to feel condident enough to match the proper images, so as part of the UI/UX demo, I let them default to a generic, default icon as if the image url is broken. I've found only 1 SWAPI resource for mapped images and it was for People.

## Commit History

This repository includes a meaningful commit history that reflects the development process, including setup, architecture decisions, feature work, refactoring, testing, and documentation updates. I did not want to dump every commit message into this README, so I included the early commits to show where the project started and how it began to take shape. The full commit history can be viewed on GitHub.

Commit 1: Star Wars Explorer Initial Setup

* Scaffolded initial app architecture & libraries.
* Added initial character portraits.
* Started with a basic home page with routes.
* This is to give the AI some context on my initial structure so it can replicate the code patterns I set instead of guessing. This can change as I develop more of this.

Commit 2: Clean up & Changes

* Modularized a few items to make pages cleaner.
* Moved some files around to clean up default React scaffolding.
* Made Mr. AI apply DRY principles to modules, such as peopleStore.ts.
* Added client-caching for data as part of the "bonus."
* Added infinite scroll (paging) as part of the "bonus."
* Update VITE config for aliases for cleaner imports.

Commit 3: Major Cleanup & Feature Page Design Updates

* Modularized more of the UI & Utilities.
* Added global page template.
* Added fonts and styling to the People page (will be used as a basis for a global template).
* Added util to convert Person URL to local image asset.
* Upgraded the design of the Mobile Dropdown for Menu Links.

Commit 4: Additions, Changes & Clean Up

* Added a default landing page if the URL is not valid.
* Converted the default React index.css file into modular CSS for the Page/List templates.
* Componentized Pages/People's list JSX into its own component to be reusable.
* Moved all constants to main utils/consts.ts file.

Commit 5: Added Modal

* Added a new modal system.
* Updated the People page to display the selected person in the Modal to display traits and more.
* Initial design, not final as of this commit.

## Submission Notes

Regardless of the decision you make on my joining the team, I do want to say I appreciated this assessment. This is the first time I have done an assessment for a job I was applying for that actually felt like the job I was applying for. A lot of the time, even for frontend roles, employers still fall back on the whole LeetCode “invert binary tree” meme and expect you to do it in five minutes, which is something I have never had to do in frontend work. Ever.

Instead, this test was genuinely enjoyable. It was fun, and it gave me some insight into how you develop, if this is anything like your day-to-day process. And the whole Star Wars theme of it all signals to me that you are probably all cool people, even though I mostly know Star Wars through memes. :)

Whether or not it was intentional to use `SWAPI.info` because of its limitations, instead of one of the other SWAPI services with more features, I did enjoy figuring out ways to make it work with the design I had in mind. I wanted to push the AI toward building a more complete app and not just a simple demo. I know I probably could have one-shot this app in a day with the right prompts, but I have learned that AI loses focus fast, and then I would have spent the rest of the week trying to hunt down issues. On top of that, the app would not have had the personality it has now.

I took the full week you provided so I could find as many logical landmines, bugs, and UI and UX issues as possible before I "shippit".

Thanks for considering me, and thanks again for the really fun assessment. :)