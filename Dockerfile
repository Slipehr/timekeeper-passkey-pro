# Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY . .

# Use npm install instead of npm ci
RUN npm install

RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]

