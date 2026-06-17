FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN node -e "console.log(JSON.stringify(require('fs').readdirSync('/usr/src/app/components')))"
RUN node -e "console.log(JSON.stringify(require('fs').readdirSync('/usr/src/app/pages')))"
EXPOSE 3000
CMD ["npm", "run", "dev"]