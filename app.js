const express = require('express');
const venom = require('venom-bot');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const multer = require('multer');
const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const base64ToImage = require('base64-to-image');
const image = ('./upload/folheto.jpg');

const app = express();
app.use(express.json()); 
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload')
    },
    filename: function (req, file, cb) {
        if (file.fieldname === "image") { // if uploading an image
            cb(null, 'folheto.jpg');
        } else {
            cb(null, file.originalname);
        }
    }
});

const upload = multer({ storage: storage });

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API de Mensagens',
        version: '1.0.0',
        description: 'Uma API para enviar mensagens para vários números de uma só vez',
      },
    },
    apis: ['./app.js'], 
};
  
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

venom
    .create({
        session: 'apizap',
        qrCallback: qrCode => {
            // Convert the base64 string to an image
            let path = './images/';
            let optionalObj = {'fileName': 'qrCode', 'type':'jpg'};
            base64ToImage.base64ToImage(qrCode, path, optionalObj);
        },
    })
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    });

    function start(client) {
        /**
         * @swagger
         * /send-message:
         *   post:
         *     summary: Envia uma mensagem para uma lista de números
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               to:
         *                 type: array
         *                 items:
         *                   type: string
         *               message:
         *                 type: string
         *               image:
         *                 type: string
         *                 format: binary
         *     responses:
         *       200:
         *         description: A mensagem foi enviada com sucesso
         *       400:
         *         description: Houve um erro ao enviar a mensagem
         */
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.get('/', (req, res) => {
          res.send(`
              <div>
                  <h1>Scan this QR Code:</h1>
                  <img src="./images/qrCode.jpg" alt="QR Code">
                  <p>Assim que scanear o QRCode, clique no botão:</p>
                  <a href="/disparador"><button>Avançar</button></a>
              </div>
          `);
      });
        app.use('/images', express.static('images'));

        app.get('/disparador', (req, res) => {
            res.sendFile(path.join(__dirname + '/index.html'));
        });

        const upload = multer({ storage: storage });

        app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

        app.post('/upload', upload.fields([{ name: 'contatos' }, { name: 'image' }]), async (req, res) => {
            console.log(req.files);

            // Read the Excel file
            const workbook = XLSX.readFile(req.files['contatos'][0].path);
            const sheet_name_list = workbook.SheetNames;
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {header:1});

            // Get the 'to' values from the Excel file
            const to = json.slice(1).map(row => row[0]); // get the first column of each row, excluding the header

            // Get the message from the request body
            const message = req.body.message;

            // Create the data object
            const data = {
                "to": to,
                "message": message,
            };

            console.log(data);
      
            // Send the JSON object to the API
            await sendMessage(data, res);

            // Redirect the user to the home page
            res.redirect('/disparador')       
        });

        app.post('/send-message', sendMessage);
        
        async function sendMessage(req, res) {
            // If req is an object with a 'body' property, get 'to' and 'message' from there
            // Otherwise, assume that req is the data object
            const { to, message } = req.body || req;
        
            // Check if 'to' and 'message' are defined
            if (!to || !message) {
                return res.status(400).send('Invalid request body. "to" and "message" are required.');
            }
        
            // Send the message to each number in the 'to' array
            for (let number of to) {
                try {
                    await client.sendImage(number + '@c.us', image, 'folheto', message);
                } catch (error) {
                    console.error(`Failed to send message to ${number}:`, error);
                    return res.status(500).send(`Failed to send message to ${number}.`);
                }
            }
        
            // Send a success response
            res.status(200).send('Messages sent successfully.');
        }
        
    }

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});