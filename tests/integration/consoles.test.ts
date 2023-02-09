import { faker } from '@faker-js/faker';
import app from 'app';
import prisma from 'config/database';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { createConsole } from '../factories/consoles-factory';

beforeAll(async () => {
	await prisma.console.deleteMany();
	await prisma.game.deleteMany();
});

const server = supertest(app);

describe('GET /consoles', () => {
	it('should respond with status 200 and empty array', async () => {
		const response = await server.get('/consoles');

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual([]);
	});

	it('should respond with status 200 and consoles data', async () => {
		const console = await createConsole();
		const response = await server.get('/consoles');

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: console.id,
					name: console.name,
				}),
			])
		);
	});
});

describe('GET /consoles/:id', () => {
	it('should respond with status 404 when invalid id', async () => {
		const response = await server.get('/consoles/0');

		expect(response.status).toEqual(httpStatus.NOT_FOUND);
	});

	it('should respond with status 404 when inexistent id', async () => {
		const console = await createConsole();
		const response = await server.get(`/consoles/${console.id + 1}`);

		expect(response.status).toEqual(httpStatus.NOT_FOUND);
		expect(response.body).not.toEqual(console);
	});

	it('should respond with status 200 with console data', async () => {
		const console = await createConsole();
		const response = await server.get(`/consoles/${console.id}`);

		expect(response.status).toEqual(httpStatus.OK);
		expect(response.body).toEqual(console);
	});
});

describe('POST /consoles', () => {
	it('should respond with status 422 when body is not given', async () => {
		const response = await server.post('/consoles');
		expect(response.status).toEqual(httpStatus.UNPROCESSABLE_ENTITY);
	});

	it('should respond with status 422 when body is not valid', async () => {
		const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
		const response = await server.post('/consoles').send(invalidBody);
		expect(response.status).toEqual(httpStatus.UNPROCESSABLE_ENTITY);
	});

	it('should respond with status 409 if name already exists', async () => {
		const console = await createConsole();
		const response = await server
			.post('/consoles')
			.send({ name: console.name });
		expect(response.status).toEqual(httpStatus.CONFLICT);
	});

	it('should respond with status 201 and insert new console in the database', async () => {
		const name = faker.name.firstName();
		const response = await server.post('/consoles').send({ name });
		expect(response.status).toEqual(httpStatus.CREATED);

		const console = await prisma.console.findUnique({
			where: { name },
		});

		expect(name).toEqual(console.name);
	});
});
