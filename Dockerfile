FROM node:latest


ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD tsconfig.json /app/tsconfig.json
ADD app /app/app

RUN bash -c "cd /app && npm install && npm run tsc"

ENTRYPOINT node /app/build/app.js
