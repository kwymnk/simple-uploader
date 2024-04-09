import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';

const server = fastify();

server.register(multipart);

server.register(fastifyStatic, {
  root: path.join(__dirname, '../files'),
  prefix: '/files/',
});

server.get('/', async (_, reply) => {
  const files = (await fs.promises.readdir(path.join(__dirname, '../files'))).filter((name) => !name.startsWith('.'));
  const html = `
      <body>
      <form action="/upload" enctype="multipart/form-data" method="post">
        <input type="file" name="upload">
        <input type="submit" value="Upload">
      </form>
      <h2>Uploaded files:</h2>
      <ul>
        ${files.map((file) => `<li><a href="/files/${file}">${file}</a></li>`)}
      </ul>
    </body>
  `;
  reply.type('text/html').send(html);
});

server.post('/upload', async (request, reply) => {
  const data = await request.file();
  if (!data) {
    reply.code(500);
    return;
  }
  const filepath = path.join(__dirname, '../files', data.filename);
  const ws = fs.createWriteStream(filepath);
  await pipeline(data.file, ws);
  reply.redirect('/');
});

server.listen({ host: '0.0.0.0', port: 80 }, (err) => {
  if (err) {
    console.error(`Failed to launch server. [error: ${err}]`);
    process.exit(1);
  }
  console.log('Server launched.');
});
