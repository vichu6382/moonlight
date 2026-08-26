const app = require('../server');
const connectDB = require('../config/db');
const { isDBConnected } = require('../config/db');

let dbPromise;

module.exports = async (req, res) => {
	if (!isDBConnected()) {
		dbPromise ||= connectDB().finally(() => {
			dbPromise = null;
		});
		await dbPromise;
	}
	return app(req, res);
};