const oracledb = require('oracledb');

// oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function run() {
	
	let connection;
	
	try {
		
		connection = await oracledb.getConnection( {
			user: "ENTRANT$DB",
			password: "entrant",
			connectString : "10.160.180.5:1521/trinity"
		});
		
		// console.log('connection [' + typeof connection + '] = %o', connection);
		
		const result = await connection.execute(`SELECT * FROM SS_DICTIONARYTYPECLS`);
		
		console.log(result.rows);
		
	} catch (err) {
		
		console.error(err);
		
	} finally {
		
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
		
	}
}

run();