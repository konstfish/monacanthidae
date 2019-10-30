FROM node
WORKDIR /opt/konstfile
COPY . /opt/konstfile
ENV IN_DOCKER_CONTAINER 1
RUN npm i
ENTRYPOINT [ "npm", "start" ]
