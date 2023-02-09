import prisma from 'config/database';
import { faker } from '@faker-js/faker';
import { Console } from '@prisma/client';

export function createConsole(params: Partial<Console> = {}): Promise<Console> {
	return prisma.console.create({
		data: {
			name: params.name || faker.name.firstName(),
		},
	});
}
