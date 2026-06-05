#!/bin/sh

# changement de droits des fichiers sources
# (un "chown" pourra aussi fonctionner mais vous ne pourrez plus éditer vos fichiers)
chmod -R 777 /var/www/html

# Appeler l'entrypoint officiel pour conserver l'init PHP
docker-php-entrypoint "$@"

# Lancer le process final en remplaçant le shell (PID 1)
exec "$@"