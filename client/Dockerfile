FROM node:20-alpine AS build
ARG VITE_WS_URL=ws://localhost:3000/ws?token=demo-token
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY client ./client
RUN cd client && npm install && VITE_WS_URL=$VITE_WS_URL npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist-client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
