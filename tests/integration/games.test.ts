import { faker } from '@faker-js/faker';
import app from 'app';
import prisma from 'config/database';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { createGame } from '../factories/games-factory';
import { createConsole } from '../factories/consoles-factory';
import { cleanDb } from '../helper';

beforeEach(async () => {
	await cleanDb();
});

const server = supertest(app);

describe('GET /games', () => {
	it('should respond with status 200 and empty array', async () => {
		const response = await server.get('/games');

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual([]);
	});

	it('should respond with status 200 and games data', async () => {
		const console = await createConsole();

		for (let i = 0; i < 4; i++) {
			await createGame({ consoleId: console.id });
		}

		const response = await server.get('/games');

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: expect.any(Number),
					title: expect.any(String),
					consoleId: expect.any(Number),
					Console: expect.objectContaining({
						id: expect.any(Number),
						name: expect.any(String),
					}),
				}),
			])
		);
	});
});

describe('GET /games/:id', () => {
	it('should respond with status 404 when invalid id', async () => {
		const response = await server.get('/games/0');

		expect(response.status).toEqual(httpStatus.NOT_FOUND);
	});

	it('should respond with status 404 when inexistent id', async () => {
		const console = await createConsole();
		const game = await createGame({ consoleId: console.id });
		const response = await server.get(`/games/${game.id + 1}`);

		expect(response.status).toEqual(httpStatus.NOT_FOUND);
	});

	it('should respond with status 200 with games data', async () => {
		const console = await createConsole();
		const game = await createGame({ consoleId: console.id });
		const response = await server.get(`/games/${game.id}`);

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual(
			expect.objectContaining({
				id: game.id,
				title: game.title,
				consoleId: console.id,
			})
		);
	});
});

describe('POST /games', () => {
	it('should respond with status 422 when body is not given', async () => {
		const response = await server.post('/games');
		expect(response.status).toEqual(httpStatus.UNPROCESSABLE_ENTITY);
	});

	it('should respond with status 422 when body is not valid', async () => {
		const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
		const response = await server.post('/games').send(invalidBody);
		expect(response.status).toEqual(httpStatus.UNPROCESSABLE_ENTITY);
	});

	it('should respond with status 409 if consoleId non-exists', async () => {
		const title = faker.commerce.productName();
		const response = await server
			.post('/games')
			.send({ title: title, consoleId: 0 });
		expect(response.status).toEqual(httpStatus.CONFLICT);
	});

	it('should respond with status 409 if name already exists', async () => {
		const console = await createConsole();
		const game = await createGame({ consoleId: console.id });
		const response = await server
			.post('/games')
			.send({ title: game.title, consoleId: console.id });
		expect(response.status).toEqual(httpStatus.CONFLICT);
	});

	it('should respond with status 201 and insert new game in the database', async () => {
		const title = faker.commerce.productName();
		const console = await createConsole();
		const response = await server
			.post('/games')
			.send({ title: title, consoleId: console.id });
		expect(response.status).toEqual(httpStatus.CREATED);

		const game = await prisma.game.findUnique({
			where: { title },
		});

		expect(title).toEqual(game.title);
	});
});
