# Panggilan Telefon Generator

Small browser generator for a `1350 x 900` call graphic.

## Stack

- Vite + React
- Tailwind CSS
- shadcn-style UI components

## Run

```bash
npm install
npm run dev
```

## Deploy to Vercel

This project can be deployed directly to Vercel as a static Vite app.

```bash
npm install -g vercel
vercel
```

Or import the repo in Vercel and use:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Features

- Changeable background image
- Changeable caller image
- Editable call bar and subtitle text
- Draggable call bar and caller card
- Mobile-first control layout
- PNG export in-browser

## Notes

- The preview scales down on smaller screens, but export is always `1350 x 900`.
- No backend is needed.
