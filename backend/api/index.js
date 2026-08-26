const app = require('../server');
const connectDB = require('../config/db');

let dbPromise;

module.exports = async (req, res) => {
	dbPromise ||= connectDB();
	await dbPromise;
	return app(req, res);
};