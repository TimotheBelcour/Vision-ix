<?php

global $app;

require_once __DIR__ . '/../auth/JwtHandler.php'; // Charge la classe JWT pour décoder le token de l'utilisateur.
require_once __DIR__ . '/../auth/Exceptions.php'; // Charge les exceptions personnalisées pour les erreurs d'authentification.
require_once __DIR__ . '/../db/DBConnection.php'; // Charge la connexion à la base de données.
require_once __DIR__ . '/../utils/AutoDeleteStream.php'; // Charge l'utilitaire pour envoyer des fichiers ZIP en réponse.

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

if (!function_exists('ensureGuessesUsernameColumn')) {
    function ensureGuessesUsernameColumn($db) {
        // Vérifie que la colonne username existe dans la table guesses.
        $stmt = $db->query("SHOW COLUMNS FROM guesses LIKE 'username'");
        $column = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$column) {
            // Ajoute la colonne username si elle n'existe pas encore.
            $db->exec("ALTER TABLE guesses ADD COLUMN username varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL AFTER guess");
        }
    }
}


/**
 * Get History (see documentation)
 */
global $app;
$app->get('/api/guesses', function( Request $request, Response $response){

    // Do a try catch which try to get user infos from token 
    // (using get_token_infos function which throw exception if token is wrong)
    try
    {
        // Vérifie que la requête contient un token JWT valide. Sinon la route renverra une erreur 401.
        $userInfos = get_token_infos($request);

        try {
            // Récupère depuis la base de données l'historique des prédictions de l'utilisateur connecté.
            // La réponse doit être un tableau JSON de toutes les entrées.

            // Prépare la requête SQL pour récupérer l’historique de l’utilisateur connecté
            $sql = "SELECT * FROM guesses WHERE username = :username ORDER BY id DESC";

            // Crée la connexion à la base de données
            $dbconn = new DB\DBConnection();
            $db = $dbconn->connect();
            ensureGuessesUsernameColumn($db);

            // Prépare et exécute la requête SQL
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':username', $userInfos->username);
            $stmt->execute();

            // Récupère les résultats de la requête SQL et les stocke dans un tableau associatif
            $guesses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Transforme l’id timestamp en vraie date lisible
            foreach ($guesses as &$guess) {
                $guess["date"] = date(DATE_RFC2822, (int) ($guess["id"] / 1000));
            }

            $db = null;

            // Convertit le tableau PHP en JSON pour l’envoyer à Postman.
            $response->getBody()->write(json_encode($guesses));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch( PDOException $e ) {
            // response : 500 : PDO Error (DB)
            $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);

        }
    }
    catch (Auth\UnauthenticatedException $e)
    {
        //response : 401 : catch UnauthenticatedException : Authentication Error
        $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
    catch (Exception $e)
    {
        // Response 500 : Error
        $response->getBody()->write('{"error": {"msg": "' . $e->getMessage() . '"}}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
});

/**
 * Download History Images classed by Character (Asterix / Obelix) and good or bad prediction :
 * 
 * ../Images
 *   |__ Asterix
 *       |__ GoodPred
 *       |__ BadPred
 *   |__ Obelix 
 *       |__ GoodPred
 *       |__ BadPred
 * 
 * (Images with no feedback (win == NULL) or with feedback Stalemate (win == 0) are not downloaded)
 */
$app->get('/api/guesses/images', function( Request $request, Response $response){

    $directory = $this->get('upload_directory');

    try
    {       
        // Vérifie que la requête contient un token JWT valide.
        $userInfos = get_token_infos($request);

        try {

            // Récupère les images dont le feedback est exploitable : win = 1 ou win = -1.
            // Les valeurs NULL ou 0 ne doivent pas être exportées dans l'archive.
            $sql = "SELECT id, imagepath, guess, win FROM guesses WHERE win IS NOT NULL AND win <> 0 AND username = :username ORDER BY id DESC";
            
            $dbconn = new DB\DBConnection();
            $db = $dbconn->connect();
            ensureGuessesUsernameColumn($db);

            $stmt = $db->prepare($sql);
            $stmt->bindParam(':username', $userInfos->username);
            $stmt->execute();
            $guesses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // $filespaths contient les chemins réels des images sur le serveur
            $filespaths = array();
            // $entriesnames contient les chemins que les fichiers auront dans le ZIP
            $entriesnames = array();

            // Parcourt les résultats pour préparer les fichiers à zipper et leur destination dans l'archive ZIP.
            foreach ($guesses as $guess) {
                $filepath = $guess["imagepath"];
    
                if (file_exists($filepath)) {
                    $character = $guess["guess"];
                    // Si win = 1, l’image va dans GoodPred. Sinon elle va dans BadPred.
                    $predictionFolder = ((int)$guess["win"] === 1) ? "GoodPred" : "BadPred";
                    // Le nom de l’entrée dans le ZIP doit être le même que le nom du fichier d’origine
                    $filenameInZip = basename($filepath);
                    // Ajoute le chemin réel du fichier à la liste des fichiers à zipper
                    $filespaths[] = $filepath;
                    // Crée l’arborescence dans le ZIP
                    $entriesnames[] = "Images/" . $character . "/" . $predictionFolder . "/" . $filenameInZip;
                }
            }
            
            $db = null;

            // Si aucune image n'est exportable, on renvoie une réponse JSON claire au lieu de créer un ZIP vide.
            if (count($filespaths) === 0) {
                $response->getBody()->write('{"success": false, "message": "No downloadable images found. Images need a win value different from NULL and 0."}');
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $filename = "archive.zip";
            $filepath = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;

            createZip($filespaths, $entriesnames, $filepath);
            //Crée réellement l’archive ZIP

            // return the response (code 200) containing the zip file as stream.
            return $response->withHeader('Content-Type', 'application/zip')
                ->withHeader('Content-Disposition', 'attachment; filename=' . $filename)
                ->withHeader('Content-Length', filesize($filepath))
                ->withBody(AutoDeleteStream::createFromFilePath($filepath));
        } 
        catch( PDOException $e ) {
            // response : 500 : PDO Error (DB)
            $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);

        }
    }
    catch (Auth\UnauthenticatedException $e)
    {
        //response : 401 : catch UnauthenticatedException : Authentication Error
        $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
    catch (Exception $e)
    {
        // Response 500 : Error
        $response->getBody()->write('{"error": {"msg": "' . $e->getMessage() . '"}}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
 
});

/**
 * Delete all entries from History & cleaning upload directory folder (delete file from FileSystem)
 * /!\ This method is authorized only for user with admin flag (Asterix)
 */
$app->delete('/api/guesses', function( Request $request, Response $response){
    //retrieve upload directory from config
    $directory = $this->get('upload_directory');
    
    // Do a try catch which try to get user infos from token 
    // (using get_token_infos function which throw exception if token is wrong)
    try
    {
        // Vérifie le token et récupère les informations de l'utilisateur connecté.
        $userInfos = get_token_infos($request);
        $admin = $userInfos->admin ?? false;


        //retrieve admin field from token user info and if admin => Do All Deletions / else not admin => throw 403 response
        if ($admin){
            
            // Do delete from DB & FileSystem
            /* TODO */

            // Récupère les chemins des images avant de supprimer les lignes en base.
            $dbconn = new DB\DBConnection();
            $db = $dbconn->connect();

            // Récupère tous les chemins d'images présents dans la table guesses avant de supprimer les entrées.
            $stmt = $db->prepare("SELECT imagepath FROM guesses");
            $stmt->execute();
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Supprime toutes les entrées de l'historique dans la base de données.
            $stmt = $db->prepare("DELETE FROM guesses");
            $stmt->execute();

            $db = null;

            // Supprime les fichiers images associés dans le dossier d'upload.
            foreach ($images as $image) {
                $filepath = $image["imagepath"];
            
                if (file_exists($filepath) && is_file($filepath)) {
                    unlink($filepath);
                }
            }

            // Supprime aussi une éventuelle archive ZIP créée précédemment.
            $archivePath = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . "archive.zip";
            if (file_exists($archivePath) && is_file($archivePath)) {
                unlink($archivePath);
            }


            $response->getBody()->write('{"success": true, "message": "All guesses deleted !"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        else{
            $response->getBody()->write('{"success": false, "message": "Access Denied : Not Allowed Operation with user\'s privilege"}');
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

    }
    catch (Auth\UnauthenticatedException $e)
    {
        //response : 401 : catch UnauthenticatedException : Authentication Error
        $response->getBody()->write('{"success": false, "message": "' . $e->getMessage() . '"}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
    catch (Exception $e)
    {
        // Response 500 : Error
        $response->getBody()->write('{"error": {"msg": "' . $e->getMessage() . '"}}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
});


/**
 * Create Zip : 
 * - $filespaths : array of every files (images paths) to add (ex: /data/uploads/1714995215898.jpg )
 * - $entriesname : array of entries destination path (ex: Images/Obelix/GoodPred/1714995215898.jpg )
 * - out zip file path (ex: /data/uploads/archive.zip)
 */
function createZip($filespaths, $entriesnames, $zipFileName)
{
    // Create instance of ZipArchive. and open the zip folder.
    $zip = new \ZipArchive();
    if ($zip->open($zipFileName, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== TRUE) {
        exit("cannot open <$zipFileName>\n");
    }

    // Adding every attachments files into the ZIP.
    for ($i = 0; $i < count($filespaths); $i++) {
        $filepath = $filespaths[$i];
        $entryname = $entriesnames[$i];

        $zip->addFile($filepath, $entryname);
    }
    $zip->close();
}


/**
 * Function which parse token, decode user infos from this token and Throws UnauthenticatedException if Autthentication Issue.
 * 
 * The UnauthenticatedException must be catched in the caller and should result to a 401 Http Error
 */
function get_token_infos(Request $request){
    // Vérifie la présence de l'en-tête Authorization.
    if ($request->hasHeader('Authorization')) {
        list($token) = sscanf($request->getHeaderLine('Authorization'), 'Bearer %s');

        $jwt = new Auth\JwtHandler();
        try
        {
            $data = $jwt->_jwt_decode_data($token); // Décode le token JWT.

            return $data; // Retourne les informations présentes dans le token.
        }
        catch (Exception $e)
        {
            // Lance une exception d'authentification si le token est invalide.
            throw new Auth\UnauthenticatedException("Invalid token : ". $e->getMessage());
        }
    }
    else{
        // Lance une exception si aucun header Authorization n'a été envoyé.
        throw new Auth\UnauthenticatedException("Unable to find Authorization Header");
    }
}


?>