# text-to-sql-demo

This repo is a demo application utilizing [pgai](https://github.com/timescale/pgai)'s
[semantic-catalog](https://github.com/timescale/pgai/blob/main/docs/semantic_catalog/quickstart.md) to complete text-to-sql over a geography database that contains data about
US states, including:

- Cities
- Rivers
- Mountains
- Lakes
- State borders

## Requirements

- [Docker](https://www.docker.com/)
- API key for [OpenAI](https://openai.com/)
- Optionally API key for other services

## Getting Started

Copy `.env.sample` to `.env`, and modify values as directed

```bash
docker compose up
```

Then navigate to `http://0.0.0.0:8080`.
