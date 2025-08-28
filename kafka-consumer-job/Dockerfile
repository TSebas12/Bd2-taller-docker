FROM node:18-alpine

WORKDIR /app

# Copiar con el nombre correcto (Package.json con P mayúscula)
COPY Package.json ./

# Renombrar a package.json para que npm lo encuentre
RUN mv Package.json package.json

# Instalar dependencias
RUN npm install

# Copiar la aplicación
COPY consumer.js .

CMD ["node", "consumer.js"]