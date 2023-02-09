import prisma from 'config/database';
import { faker } from '@faker-js/faker';
import { Game } from '@prisma/client';

export async function createGame(params: Partial<Game> = {}): Promise<Game> {
	return prisma.game.create({
		data: {
			title: params.title || faker.commerce.productName(),
			consoleId: params.consoleId || faker.datatype.number(),
		},
	});
}
