const express = require('express');
const tf = require('@tensorflow/tfjs-node');
var multer = require('multer');
const child_process = require('child_process');
const fs = require('fs');
var path = require('path');



const app = express();


app.use(express.urlencoded({ extended: false }));


var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './images-tmp')
    },
    filename: function(req, file, cb) {
        let fileExt = file.originalname.split('.').pop();
        cb(null, Date.now() + "." + fileExt)
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

var upload = multer({
    storage: storage,
    fileFilter: fileFilter
});


// ---------------------------------------------------------
// Public routes
// ---------------------------------------------------------

app.get('/api', (req, res) => {
    res.send('Welcome to \"Asterix VS Obelix\" API');
});

app.get('/api/doc', function(req, res) {
	res.sendFile(path.join(__dirname + '/doc', '/index.html'));
});


app.post("/api/guesses", upload.single('guessimage'), async(req, res, next) => {
    if (req.file) {
        try {
            let id = Date.now();

            const pathName = req.file.path;

            const model = await tf.loadLayersModel(`file://${MODEL_DIR_PATH}/model.json`);

            let guessres = classifyImage(model, pathName);

            //const guess = { guess: guessres };

            // delete a file asynchronously
            fs.unlink(pathName, (err) => {
                if (err) {
                console.error(err);
                }
            });

            res.status(201).send({ guess: guessres });
            

        } catch (error) {
            console.log("ERR : " + error);
            res.status(500).send({ error: "" + error });
        }

    }
});




const readImage = path => {
    const imageBuffer = fs.readFileSync(path);
    const tfimage = tf.node.decodeImage(imageBuffer, channels = 3);
    return tfimage;
}

const classifyImage = (model, imagepath) => {
    const classes = ['Asterix', 'Obelix'];

    let image = readImage(imagepath).expandDims();
    image = tf.image.resizeBilinear(image, [150, 150]).div(tf.scalar(255));
    image = tf.cast(image, dtype = 'float32');

    let prediction = model.predict(image);
    //console.log("PREDICT : "+prediction.dataSync());
    figurineClass = Math.round(prediction.dataSync());

    return classes[figurineClass];
}

const MODEL_DIR_PATH = `${__dirname}`;

const port = 3000;

app.listen(port, () => console.log('Server running...'));