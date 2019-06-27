
import bodyParser from 'body-parser';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { execute } from './sandbox';
import Keycloak from 'keycloak-connect';

const memoryStore = new session.MemoryStore();

const app = express();
const port = 4000;
const keycloak = new Keycloak({ store: memoryStore });

app.use(cors());
app.use(keycloak.middleware());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port, () => {
  console.log('listening on port ' + port);
});

app.post('/job', keycloak.protect(), (req, res) => {
  let answer = '' + execute(req.body.func, req.body.data);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.write(answer);
  res.end();
});
