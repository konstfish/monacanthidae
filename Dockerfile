FROM node
RUN npm i
ENV IN_DOCKER_CONTAINER 1
WORKDIR /opt/konstfile
COPY . /opt/konstfile
ENTRYPOINT [ "npm", "start" ]
