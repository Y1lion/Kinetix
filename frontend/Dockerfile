# Fase 1: compila il frontend Next.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL pubblico del backend Azure
ARG NEXT_PUBLIC_API_URL=https://kinetix-backend.icystone-4f68f29d.switzerlandnorth.azurecontainerapps.io
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Fase 2: pubblica i file statici con Nginx
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]