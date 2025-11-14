// Simple server for Netlify Functions
const express = require('express');
const serverless = require('serverless-http');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const router = express.Router();

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Forward API requests to Flask
router.all('*', (req, res) => {
  const flask = spawn('python', [
    path.join(__dirname, '../app.py')
  ]);
  
  let data = '';
  flask.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });
  
  flask.stderr.on('data', (chunk) => {
    console.error(`Flask Error: ${chunk.toString()}`);
  });
  
  flask.on('close', (code) => {
    res.send(`Flask process exited with code ${code}`);
  });
});

app.use('/.netlify/functions/api', router);

// Export handler for serverless
module.exports.handler = serverless(app);
