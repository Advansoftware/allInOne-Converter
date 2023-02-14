FROM node:latest
RUN npm install -g npm@9.4.2
COPY node-entrypoint.sh /usr/local/bin
RUN ln -s usr/local/bin/node-entrypoint.sh /
RUN chmod +x node-entrypoint.sh