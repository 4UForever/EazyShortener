import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('EazyShortener Client API')
    .setDescription('Authenticated URL-shortening API for verified EazyShortener users.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'API token', description: 'Use an ez_live_ API token.' },
      'apiToken',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.components ??= {};
  document.components.schemas ??= {};
  Object.assign(document.components.schemas, {
    BatchShortenItem: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri', maxLength: 2048 },
        customAlias: { type: 'string', minLength: 3, maxLength: 32, nullable: true },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    BatchShortenRequest: {
      type: 'object',
      required: ['links'],
      properties: {
        links: {
          type: 'array',
          minItems: 1,
          maxItems: 10,
          items: { $ref: '#/components/schemas/BatchShortenItem' },
        },
      },
    },
    ShortenedLink: {
      type: 'object',
      required: ['id', 'shortCode', 'shortUrl', 'originalUrl'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        shortCode: { type: 'string' },
        shortUrl: { type: 'string', format: 'uri' },
        originalUrl: { type: 'string', format: 'uri' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    BatchShortenResponse: {
      type: 'object',
      required: ['links'],
      properties: { links: { type: 'array', items: { $ref: '#/components/schemas/ShortenedLink' } } },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer' },
        message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
        error: { type: 'string' },
      },
    },
  });

  const shortenPath = document.paths['/api/v1/shorten'];
  if (shortenPath?.post) {
    shortenPath.post.security = [{ apiToken: [] }];
    shortenPath.post.requestBody = {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchShortenRequest' } } },
    };
    shortenPath.post.responses = {
      '201': {
        description: 'Batch created atomically.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchShortenResponse' } } },
      },
      '400': {
        description: 'Invalid batch or link input.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      '401': {
        description: 'Missing, invalid, expired, or revoked API token.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    };
  }

  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });
  return document;
}
