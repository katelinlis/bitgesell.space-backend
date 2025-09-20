FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || true
COPY . .
RUN npm run build || true
EXPOSE 8081
CMD ["npm","run","dev"]


