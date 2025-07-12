const express = require('express');
const cors = require('cors');
const next = require('next');
const { createServer } = require( 'https');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config();


const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT_SERVER_DEV;


const httpsOptions = {
    key: readFileSync(join( __dirname, './cert/clave.key' )),
    cert: readFileSync(join( __dirname, './cert/certificado.crt' ))
};


app.prepare()
    .then(() => {

        const server = express();
        server.use(cors({
            origin: '*',
        }));
        server.all('*', (req, res) => {
            return handle(req, res);
        });

        createServer(httpsOptions, server).listen(port, err => {
            if(err) throw err;
            console.log(`Server on listen https://localhost:${port} next`);
        });
    });

