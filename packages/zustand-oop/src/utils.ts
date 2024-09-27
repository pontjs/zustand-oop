import { plainToInstance } from "class-transformer";

export const mergeToInstance = (Clazz) => (persisted, initial) => {
	const merged = {
		...initial,
		...persisted,
	};

	return plainToInstance(Clazz, merged);
};
