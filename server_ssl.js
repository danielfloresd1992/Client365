const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');


app.set('port', process.env.PORT_SERVER || 3008);

app.get('/.well-known/pki-validation/:file', (req, res) => {
    try {
        return res.sendFile(path.join(__dirname, `./cert/${req.params.file}`));
    } 
    catch (error) {
        console.log(error);
        return res.status(404).json({ error: 'File not found' });
    }
});


app.listen(app.get('port'), () => {
    console.log(`server on listener: ${app.get('port')}`);
});