include .env
export $(shell sed 's/=.*//' .env)

all: service


init: 
	install_docker & install_postgresql & init_db & service

logs_lotto: 
	journalctl -u lotto -n  20

install_docker:
	sudo apt update \
	sudo apt install apt-transport-https ca-certificates curl software-properties-common \
	sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc \
    sudo chmod a+r /etc/apt/keyrings/docker.asc \
	echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

install_postgresql:
	sudo apt update \
	sudo apt install postgresql postgresql-contrib \
	sudo systemctl enable postgresql.service \
	sudo systemctl start postgresql.service \
	sudo systemctl status postgresql.service \

init_db:
    sudo -u postgres psql -c "CREATE DATABASE $(DB_NAME);"
	sudo -u postgres psql -c "CREATE USER $(DB_USER) WITH ENCRYPTED PASSWORD '$(DB_PASS)';"
	sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $(DB_NAME) TO $(DB_USER);"

service:
	chmod +x ./make_service.sh \
	sh ./make_service.sh