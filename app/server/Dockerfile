FROM node:20

WORKDIR /server

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 6969
	
RUN npx tsc
	
CMD ["npm", "run", "start"]