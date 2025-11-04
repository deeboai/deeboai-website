# DeeboAI Website

Modern marketing site for DeeboAI showcasing AI-powered products, services, and the founding team. The project is built with Vite, React, TypeScript, and Tailwind CSS (including shadcn/ui components).

## Getting Started

```bash
git clone <repo-url>
cd deeboai-website
npm install
npm run dev
```

The site runs at `http://localhost:5173` by default.

## Available Scripts

- `npm run dev` – start the Vite development server with hot reloading.
- `npm run build` – create a production build in `dist/`.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run ESLint across the codebase.

## Project Structure

- `src/pages` – top-level route pages (Home, Services, Products, Partners, Team, Contact, DeeboAI Studio).
- `src/components` – shared UI elements, sections, and shadcn/ui primitives.
- `src/assets` – imagery, video, and team collateral.
- `public` – static assets served from the root (favicons, robots.txt, etc.).

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS with custom design system tokens in `src/index.css`
- shadcn/ui component library
- React Router for routing
- TanStack Query (wired for data fetching)

## Deployment

The project can be deployed to any static hosting provider that supports serving the Vite build output (Netlify, Vercel, Cloudflare Pages, etc.). Run `npm run build` and upload the contents of the `dist` directory to your platform of choice.
