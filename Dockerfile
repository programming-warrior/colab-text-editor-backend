FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV DB_HOST=connection_string_to_mongodb_atlas

ENV SECRET_KEY=Jwt_signature


EXPOSE 7000

#make it npm production when deploying to production
CMD ["npm","dev"]