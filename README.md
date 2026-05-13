# Mindoku — AI-Powered Sudoku Platform

Mindoku is a modern web platform for playing Sudoku. It is designed as a startup-style product prototype, not just a basic puzzle website.

## Product idea

Most Sudoku websites only let users fill a 9x9 board. Mindoku focuses on learning, retention and competition:

- users return every day for a Daily Challenge;
- players compete through a city leaderboard;
- the AI Coach explains the logic behind moves;
- stats and streaks motivate progress;
- the Pro page demonstrates a monetization path.

## Target audience

Mindoku is for students, puzzle lovers, and people who want a short daily brain-training routine. It can also help beginners learn Sudoku strategies instead of simply guessing numbers.

## Features

- Responsive Sudoku board for desktop and mobile
- Unique Sudoku puzzle generator
- Four difficulty levels: Easy, Medium, Hard, Expert
- Daily Challenge generated from the current date
- Rule checking and mistake tracking
- Timer
- Notes mode for candidate numbers
- Hint system
- AI Coach explanation panel
- Local player profile
- City-based leaderboard prototype
- User statistics: played games, solved games, best time, daily streak
- Light and dark themes
- Upgrade to Pro pricing screen
- LocalStorage persistence for profile, stats and leaderboard

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage

The project intentionally has no heavy dependencies, so it can be deployed quickly on Vercel, Netlify, GitHub Pages, Replit or any static hosting provider.

## Why this is valuable

Mindoku is not only a Sudoku board. It shows product thinking through:

1. **Retention** — Daily Challenge and streaks.
2. **Learning** — AI Coach explains why a number fits.
3. **Competition** — city leaderboard creates social motivation.
4. **Monetization** — Pro page with premium features.
5. **Accessibility** — clean responsive design, keyboard input and mobile number pad.

## How to run locally

Open `index.html` in a browser.

For a local server, you can use:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## How to deploy

### Option 1: Vercel

1. Push this folder to GitHub.
2. Go to Vercel.
3. Import the GitHub repository.
4. Select static project settings.
5. Deploy.

### Option 2: Netlify

1. Push this folder to GitHub.
2. Go to Netlify.
3. Create a new site from Git.
4. Select the repository.
5. Deploy.

### Option 3: GitHub Pages

1. Push the files to a GitHub repository.
2. Open repository settings.
3. Go to Pages.
4. Choose the main branch and root folder.
5. Save and wait for the public link.

## Future improvements

- Real authentication through Supabase or Firebase
- Real database leaderboard
- Stripe checkout integration
- Multiplayer speed battles
- Advanced solving strategies: naked singles, hidden singles, pairs
- Custom skins and sound effects
- Internationalization

## Submission links

Add your final links here before submitting:

- Live project: `https://your-project-link.com`
- GitHub repository: `https://github.com/your-username/mindoku`
