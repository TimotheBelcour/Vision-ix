<?php

require_once __DIR__ . '/../auth/JwtHandler.php'; // Charge la classe de génération et de vérification des tokens JWT
require_once __DIR__ . '/../db/DBConnection.php'; // Charge la classe de connexion à la base de données

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;


/**
 * Post Login
 */
$app->post('/api/login', function( Request $request, Response $response){
    
    // Prépare la requête SQL pour vérifier si l'utilisateur existe avec ces identifiants.
    $sql = "SELECT * FROM users where UPPER(username) = :username and password = :password";
 
    try {
        // Se connecte à la base de données.
        $dbconn = new DB\DBConnection();
        $db = $dbconn->connect();
            
        // Prépare la requête SQL en utilisant PDO.
        $stmt = $db->prepare( $sql );

        // Récupère le corps JSON de la requête et le décode en tableau PHP.
        $data = json_decode($request->getBody()->getContents(), true);

        $username = strtoupper($data["email"]); // Normalise l'email vers des majuscules pour la comparaison.
        $password = $data["pass"]; // Récupère le mot de passe saisi par l'utilisateur.
    
        $stmt->bindParam(':username', $username); // Lie la valeur du nom d'utilisateur au paramètre SQL.
        $stmt->bindParam(':password', $password); // Lie la valeur du mot de passe au paramètre SQL.

        $stmt->execute(); // Exécute la requête préparée.

        // Récupère les résultats ; normalement il doit y avoir au plus un utilisateur.
        $foundusers = $stmt->fetchAll( );

        $db = null; // Ferme la connexion à la base de données.

        if (count($foundusers)==1)
        {
            // Si un utilisateur est trouvé, on récupère son username.
            $username = $foundusers[0]['username'];

            // Création d'un token JWT.
            $jwt = new Auth\JwtHandler();

            // Construction du payload du token JWT avec le username et le statut admin.
            $token = $jwt->_jwt_encode_data(
                'Toutatix.iutsd', // Identifiant de l'émetteur du token.
                array(
                    "username"=>$username,
                    "admin" => (bool)$foundusers[0]['admin']
                    ) // On place les informations utiles de l'utilisateur dans le token.
            );

            // Réponse 201 : connexion réussie, renvoie le token.
            $response->getBody()->write('{"success":true, "message":"Enjoy your token", "token":"'.$token.'"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        else
        {
            // Réponse 401 : identifiants invalides.
            $response->getBody()->write('{"success": false, "message": "Invalid Username/Password"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }
    catch( PDOException $e ) {
        echo $e; // Affiche l'erreur PDO pour le debug.
        // Réponse 500 : erreur de base de données.
        $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);

    }
});

