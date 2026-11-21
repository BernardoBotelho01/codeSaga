FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY client client
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
ENV API_PORT=4000
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev && npm cache clean --force
COPY server/src server/src
COPY --from=build /app/client/dist client/dist
USER node
EXPOSE 4000
CMD ["node", "server/src/index.js"]
