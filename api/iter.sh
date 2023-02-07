source .env
rm db.sqlite3
python manage.py migrate
python manage.py runserver

# now add all the takes
