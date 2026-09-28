import { Router, static as serveStatic } from 'express';
import swaggerUi from 'swagger-ui-dist';
import helmet from 'helmet';
import { openapi } from '../docs/openapi.js';
const router=Router({strict:true});
// Local assets and external initialization script keep scripts restricted to self.
router.use('/docs',helmet.contentSecurityPolicy({directives:{'script-src':["'self'"],'img-src':["'self'",'data:'],'upgrade-insecure-requests':null}}));
router.get('/openapi.json',(req,res)=>res.json(openapi));
router.get('/docs',(req,res)=>res.redirect(302,'docs/'));
router.get('/docs/',(req,res)=>res.type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EventHub API — Swagger</title><link rel="stylesheet" href="./swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="./swagger-ui-bundle.js"></script><script src="./init.js"></script></body></html>`));
router.get('/docs/init.js',(req,res)=>res.type('application/javascript').send(`window.onload = function () { window.ui = SwaggerUIBundle({url: '../openapi.json',dom_id:'#swagger-ui',deepLinking:true,persistAuthorization:false,validatorUrl:null,displayRequestDuration:true,tryItOutEnabled:false}); };`));
router.use('/docs',serveStatic(swaggerUi.getAbsoluteFSPath(),{index:false}));
export default router;
