# Image de base sur DockerHub
FROM php:8.3-apache

# Ajout du module de rewriting d'Apache
RUN a2enmod rewrite 

# Mise à jour du gestionnaire de paquets apt-get et installation de zip / unzip / dos2unix
RUN apt-get update && apt-get install -y unzip zip dos2unix

# Changement du workdir principal pour qu'il pointe vers /var/www/html 
# (dossier d'entrée du serveur d'application ou se trouvent les sources)
WORKDIR /var/www/html

# Installation de quelques extensions php indispensables pour notre projet
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions gd pdo_mysql bcmath zip intl opcache

# Installation de composer en utilisant le "build multistage" permettant d’exécuter des sous 
# parties du Dockerfile d'une autre image (plus concis qu'une install 'classique' avec apt-get)
COPY --from=composer:2.0 /usr/bin/composer /usr/local/bin/composer

# Indiquer que le service utilisera le port 80
EXPOSE 80

# Copie du fichier entrypoint dans l'image Docker dans le dossier "/opt"
COPY entrypoint.sh /opt/entrypoint.sh

# Ajout des droits d'exécution chmod 744 sur ce dernier fichier
RUN chmod 744 /opt/entrypoint.sh
RUN dos2unix /opt/entrypoint.sh

# Conserver la commande par défaut (apache en foreground)
CMD ["apache2-foreground"]

# Execution de l'entry point "/opt/entrypoint.sh" lors du démarrage du conteneur
# Exécution du script avec sh pour éviter les erreurs de shebang/fin de ligne
ENTRYPOINT ["/bin/sh", "/opt/entrypoint.sh"]