import swaggerGen from 'swagger-jsdoc'

const options: swaggerGen.Options = {
  definition: {
    info: {
      title: 'Scheduler API',
      version: '1.0.0',
      description: 'API of the ODS Scheduler',
    },
    host: 'localhost:9000',
    basePath: '/api/scheduler',
  },
  // path to files with swagger annotations
  // Note: relative to package.json
  // Note: since we transpile and then start, reference the dist directory + transpiled js files
  apis: [
    'dist/index.js',                            // REST API
    'dist/transformationEndpoint.js',           // REST API
    'dist/interfaces/notificationRequest.js',   // model classes
    'dist/interfaces/transformationRequest.js', // model classes
    'dist/interfaces/jobResult.js',             // model classes
    'dist/interfaces/jobError.js',              // model classes
    'dist/interfaces/stats.js',                 // model classes
  ],
};

// initialize swagger-jsdoc
const swaggerSpec = swaggerGen(options);

export function enableSwagger(app: any) {
  app.get('/api-docs', function(req: any, res: any) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
