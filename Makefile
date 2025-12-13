.PHONY: install start dev test test-client lint format docker-up docker-down

install:
npm install

start:
npm run start

dev:
npm run dev

test:
npm test

test-client:
npm run test:client

lint:
npm run lint

format:
npm run format

docker-up:
docker-compose up --build

docker-down:
docker-compose down
