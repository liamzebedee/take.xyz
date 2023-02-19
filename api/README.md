The Take API
============

Uses Django + Django REST Framework.

## Install.

```sh
python3 -m venv env
source env/bin/activate

pipenv install
```

## Run.

```sh
# edit .env
cp .env.example .env

# Migrate.
python manage.py migrate

# Run.
python manage.py runserver

# Run the indexer.
cd ../indexer
npm i
# index from take id 1
FROM_TAKE=1 npm run start
```

## Docker.

```sh
cp .env.example .env
sudo docker-compose --env-file ./.env up -d
```