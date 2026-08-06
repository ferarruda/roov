import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppException } from '../src/common/errors/app.exception';

/**
 * Testes de contrato da API.
 *
 * O que está sendo verificado não é a rota de health em si — é o contrato do
 * D7: envelope de sucesso, envelope de erro e correlation id. Esses três são
 * a fundação sobre a qual todo módulo futuro será escrito. Se quebrarem, todo
 * o frontend quebra junto, então merecem teste desde o primeiro dia.
 *
 * Requer o banco local no ar (`supabase start`).
 */
describe('Contrato da API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Espelha o bootstrap de main.ts. Divergência aqui produz teste que passa
    // e produção que falha.
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) =>
          AppException.validationFailed(
            errors.map((error) => ({
              field: error.property,
              message: Object.values(error.constraints ?? {}).join('; '),
            })),
          ),
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('envelopa a resposta de sucesso em { data, meta }', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data.status).toBe('ok');
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });

  it('devolve o formato de erro padrão em rota inexistente', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/rota-que-nao-existe')
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('details');
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it('expõe o correlation id no cabeçalho da resposta', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('preserva o correlation id enviado pelo cliente', async () => {
    const provided = 'teste-correlation-id';

    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .set('x-request-id', provided)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(provided);
    expect(response.body.meta.requestId).toBe(provided);
  });
});

/**
 * Fluxo de autenticação ponta a ponta.
 *
 * Roda contra Postgres real (`docker compose up -d`). Mock de ORM aqui não
 * provaria nada: o que precisa ser verificado inclui restrições de unicidade e
 * comportamento transacional, que só o banco de verdade exerce.
 */
describe('Autenticação (e2e)', () => {
  let app: INestApplication;
  const unico = Date.now();
  const conta = {
    email: `teste-${unico}@exemplo.com`,
    username: `teste_${unico}`,
    name: 'Usuário de Teste',
    password: 'senha-de-teste-123',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) =>
          AppException.validationFailed(
            errors.map((error) => ({
              field: error.property,
              message: Object.values(error.constraints ?? {}).join('; '),
            })),
          ),
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cadastra e devolve uma sessão sem expor o hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(conta)
      .expect(201);

    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(conta.email);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('recusa e-mail já cadastrado', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ ...conta, username: `outro_${unico}` })
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('rejeita campo não declarado no DTO', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ ...conta, role: 'admin' })
      .expect(422);

    // Sem whitelist, `role: admin` chegaria à camada de dados.
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('nega acesso a rota protegida sem token', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('completa o ciclo login → me → refresh → logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: conta.email, password: conta.password })
      .expect(200);

    const { accessToken, refreshToken } = login.body.data;

    const me = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.data.username).toBe(conta.username);

    const renovada = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(renovada.body.data.refreshToken).not.toBe(refreshToken);

    // O token antigo foi rotacionado: reapresentá-lo derruba todas as sessões.
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({ refreshToken: renovada.body.data.refreshToken })
      .expect(204);
  });

  it('responde igual para senha errada e e-mail inexistente', async () => {
    const senhaErrada = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: conta.email, password: 'senha-errada-123' })
      .expect(401);

    const semConta = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: `nao-existe-${unico}@exemplo.com`, password: 'qualquer-123' })
      .expect(401);

    expect(senhaErrada.body.error.message).toBe(semConta.body.error.message);
  });
});
