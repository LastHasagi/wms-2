const express = require('express');
const venom = require('venom-bot')
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const multer = require('multer');

const app = express();  
app.use(express.json()); 
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './upload')
    },
    filename: function (req, file, cb) {
      cb(null, 'folheto.jpg')
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
        app.post("/send-message", upload.single('image'), async (req, res) => { 
            const { to, message } = req.body;
            const image = './upload/folheto.jpg';

            // Verifique se 'to' é uma array
            if (!Array.isArray(to)) {
                return res.status(400).json({ error: "'to' deve ser uma array de números." });
            }

            // Envie a mensagem para cada número
            for (let i = 0; i < to.length; i++) {
                await client.sendImage(to[i] + '@c.us', image, 'folheto', message);
            }

            res.json("mensagens enviadas");
        });
        
    }

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});