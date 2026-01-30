FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ENV NUXT_PUBLIC_API_BASE=http://api:7000
EXPOSE 3000
CMD ["npm","run","dev"]
