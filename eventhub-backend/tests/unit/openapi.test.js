import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { openapi } from '../../src/docs/openapi.js';
import { app } from '../../src/app.js';
import { pool } from '../../src/config/database.js';

afterAll(() => pool.end());

test('OpenAPI validates and documents the 20 API operations', async () => {
  await SwaggerParser.validate(structuredClone(openapi));
  expect(Object.values(openapi.paths).flatMap(Object.keys)).toHaveLength(20);
  expect(openapi.security).toEqual([{bearerAuth:[]}]);
  expect(openapi.paths['/auth/login'].post.security).toEqual([]);
});

test('public docs redirect once and serve local scripts with restrictive CSP', async () => {
  const redirect = await request(app).get('/api/docs').expect(302);
  expect(redirect.headers.location).toBe('docs/');
  const html = await request(app).get('/api/docs/').expect(200);
  expect(html.text).toContain('swagger-ui-bundle.js');
  expect(html.headers['content-security-policy']).toContain("script-src 'self'");
  expect(html.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  await request(app).get('/api/docs/swagger-ui-bundle.js').expect(200);
  const init = await request(app).get('/api/docs/init.js').expect(200);
  expect(init.text).toContain('persistAuthorization:false');
  const spec = await request(app).get('/api/openapi.json').expect(200);
  expect(spec.body).toEqual(JSON.parse(JSON.stringify(openapi)));
  await request(app).get('/api/events').expect(401);
});

test('Swagger same-origin requests work while foreign origins remain rejected', async () => {
  await request(app).post('/api/auth/login').set('Host','localhost:5000')
    .set('Origin','http://localhost:5000').send({}).expect(400);
  await request(app).post('/api/auth/login').set('Host','localhost:5000')
    .set('Origin','https://untrusted.example').send({}).expect(403);
});
