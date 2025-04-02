
# Vasaloppet Analytics - Race Performance Visualization

## Overview

Vasaloppet Analytics is a web application that allows participants of the world's oldest, longest, and largest cross-country ski race (Vasaloppet) to visualize and analyze their race performance. Users can search for athletes by bib number or name, view detailed checkpoint statistics, and compare their performance against other participants with similar characteristics.

## Features

- **Athlete search**: Look up racers by bib number or name
- **Race analytics**: View performance metrics such as percentile ranking, time behind winner, and comparison to average
- **Checkpoint analysis**: See detailed split times and positions at each checkpoint
- **Data visualization**:
  - Finish time distribution compared to similar participants
  - Pace analysis by checkpoint (violin plot)
  - Race progress chart showing position changes throughout the race
- **Advanced filtering**: Compare performance with customizable groups:
  - By gender
  - By start group
  - By age category
  - Finishers only option

## Technologies Used

- **Frontend**: React with TypeScript, built using Vite
- **UI Components**: Shadcn UI components library (built on Radix UI primitives)
- **State Management**: React Query for server state, React Context for local state
- **Data Visualization**: D3.js and Recharts
- **Data Collection**: Python scraper with Scrapy for fetching race data
- **Containerization**: Docker for development and deployment

## Project Structure

```
vasaloppet-viz-racer-stats/
├── public/           # Static assets and data files
│   └── data/         # JSON data files for race results
├── scraper/          # Python scraper for collecting race data
│   ├── Dockerfile
│   └── fetch_data.py
├── src/
│   ├── components/   # UI components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── pages/        # Page components
│   ├── services/     # API and data service functions
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Helper utilities
└── docker-compose.yml
```

## How It Works

1. The scraper collects race data from Vasaloppet's results website
2. The data is transformed and stored as JSON files
3. The web application loads this data and provides an interactive interface for analysis
4. Users can search for athletes and visualize their performance relative to others

## Development

### Prerequisites

- Docker and Docker Compose

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/VictorGardi/vasaloppet-viz-racer-stats.git
   cd vasaloppet-viz-racer-stats
   ```

2. Start the development server using Docker:
   ```bash
   docker-compose up
   ```

3. Access the application at http://localhost:8081

### Running the Scraper

To fetch new race data:

```bash
docker-compose run --rm scraper
```

This will populate the `data` directory with results from available races.

## Deployment

The application can be deployed as a static site on platforms like Netlify, Vercel, or GitHub Pages. The scraper can be run periodically to update the race data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Data provided by [Vasaloppet](https://results.vasaloppet.se/)
- Built with [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts built with [D3.js](https://d3js.org/) and [Recharts](https://recharts.org/)

---

*Note: This application is not officially affiliated with Vasaloppet.*
