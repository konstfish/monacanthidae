if [ "$1" == "b" ]; then
  docker build -t monacanthidae .
fi

docker container stop monacanthidae
docker container rm monacanthidae
docker run -v /stor/pictures/:/data -d -p 6969:3000 --name monacanthidae monacanthidae:latest
