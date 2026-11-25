import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configurarOpenApi(app: INestApplication): void {
  const configuracao = new DocumentBuilder()
    .setTitle('Vorgame API')
    .setDescription('API do protótipo do Vorgame, histórias HU01 a HU05.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, configuracao),
    { jsonDocumentUrl: 'docs-json', raw: ['json'] },
  );
}
