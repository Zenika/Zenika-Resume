const pg = require("pg");
const fetch = require("node-fetch");
const sjcl = require("sjcl");

const pool = new pg.Pool({
  host: process.env.PGHOST,
  database: process.env.PGDB,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: true
});

const decrypt = (content, secret, events, state) => {
  try {
    return Promise.resolve(sjcl.decrypt(secret, content));
  } catch (e) {
    events.emit("Estore:decryption_failed", state);

    return Promise.reject(new Error("decryption failed"));
  }
};

const executeQuery = (query, params) => {
  return new Promise((resolve, reject) =>
    pool.connect((err, client, done) => {
      if (err) {
        reject(err);
        return;
      }
      if (!client) {
        reject("no pg client available");
        return;
      }

      try {
        client.query(query, params, (err, result) => {
          done();
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
        return;
      }
    })
  );
};

const insertResumeIntoDms = async resume => {
  try {
    const response = await fetch(process.env.DMS_URL, {
      method: "POST",
      headers: {
        "X-Hasura-Admin-Secret": process.env.HASURA_ADMIN_SECRET || "key",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation (
            $content: String!, 
            $last_modified: timestamptz!, 
            $metadata: String!, 
            $path: String!, 
            $uuid: uuid!, 
            $version: Int!
          ) {
            insert_resume(
              objects: [
                {
                  last_modified: $last_modified, 
                  metadata: $metadata, 
                  version: $version, 
                  uuid: $uuid, 
                  path: $path, 
                  content: $content
                }
              ],
              on_conflict: {
                constraint: resume_pkey, 
                update_columns: [content, last_modified]
              }
            ) {
              affected_rows
            }
          }
        `,
        variables: {
          uuid: resume.uuid,
          content: resume.content,
          metadata: resume.metadata,
          path: resume.path,
          version: resume.version,
          last_modified: resume.last_modified
        }
      })
    });
    if (!response.ok) {
      console.error(`Response [${response.status}]: `, response.statusText);
    } else {
      console.log(JSON.stringify(await response.json()));
    }
  } catch (err) {
    console.error("Error", err);
  }
};

const decryptResumeContent = async data => {
  data.content = await decrypt(data.content, "");
  return data;
};

const handleResume = async resume =>
  insertResumeIntoDms(await decryptResumeContent(resume));

const handleResumeList = data =>
  Promise.all(data.rows.map(row => handleResume(row)));

(async () => {
  try {
    console.log("Querying resumes ...");
    const resumesData = await executeQuery(
      "SELECT id, uuid, content, metadata, path, version, last_modified FROM resume ORDER BY last_modified DESC",
      []
    );
    console.log(`Query successful, got ${resumesData.rows.length} rows`);
    console.log("Inserting rows into the DMS ...");
    await handleResumeList(resumesData);
    console.log("Migration finished !");
  } catch (err) {
    console.error(err);
  }
})();
