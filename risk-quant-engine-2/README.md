# NIST Risk Assessment & Risk Quant Engine

A FAIR-compliant quantitative cybersecurity risk assessment engine featuring Monte Carlo ALE simulations and dynamic NIST SP 800-30 Rev. 1 modeling.

## Tech Stack & Architecture

- **Framework:** React + TanStack Start
- **Routing:** TanStack Router (File-based routing)
- **State & Data Fetching:** TanStack React Query
- **Styling:** Tailwind CSS (Tactical Theme)

## Project Structure

```text
risk-fluidity/
├── public/
│   └── favicon.ico
└── src/
    ├── lib/
    │   └── theme.tsx
    ├── routes/
    │   ├── __root.tsx    # Root shell, HTML head, & global providers
    │   └── index.tsx     # Main dashboard route
    └── styles.css
