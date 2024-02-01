FROM node:latest
RUN npm install -g npm@latest
COPY node-entrypoint.sh /usr/local/bin
RUN ln -s usr/local/bin/node-entrypoint.sh /
RUN chmod +x node-entrypoint.sh