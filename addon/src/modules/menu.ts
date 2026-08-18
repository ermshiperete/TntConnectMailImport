// Wrapper for handling errors during creation of menu items.
export async function addEntry(createData: {
	id: string,
	title: string,
	contexts: [string],
}): Promise<string> {
	const { promise, resolve, reject } = Promise.withResolvers<string>();
	let error;
	let id = browser.menus.create(createData, () => {
		error = browser.runtime.lastError; // Either null or an Error object.
		if (error) {
			reject(error)
		} else {
			resolve(id);
		}
	});

	try {
		await promise;
		console.info(`Successfully created menu entry <${id}>`);
	} catch (error: any) {
		if (error.message.includes("already exists")) {
			console.info(`The menu entry <${id}> exists already and was not added again.`);
		} else {
			console.error("Failed to create menu entry:", createData, error);
		}
	}

	return id;
}
