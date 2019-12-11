FROM node
WORKDIR /opt/monacanthidae
COPY . /opt/monacanthidae
ENV IN_DOCKER_CONTAINER 1
RUN npm i
ENTRYPOINT [ "npm", "start" ]
