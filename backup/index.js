const pg = require("pg");
const fetch = require("node-fetch");
const sjcl = require("sjcl");

const pool = new pg.Pool({ssl: true});

function decrypt(content, secret, events, state) {
  try {
    return Promise.resolve(sjcl.decrypt(secret, content));
  } catch (e) {
    events.emit("Estore:decryption_failed", state);

    return Promise.reject(new Error("decryption failed"));
  }
}

const executeQueryWithCallback = (query, params, callback) => {
  pool.connect(function(err, client, done) {
    try {
      if (err) {
        console.error(err);
      }
      if (!client) {
        console.error("no pg client available");
        return;
      }
      client.query(query, params, function(err, result) {
        done();
        if (err) {
          console.error(err);
        } else {
          callback(result);
        }
      });
    } catch (error) {
      try {
        done();
      } catch (error) {
        // nothing to do just keep the program running
      }
      console.error(error);
    }
  });
};

const insertResumeIntoDms = async resume => {
  try {
    console.log("metadata", resume.metadata);
    const response = await fetch(process.env.DMS_URL, {
      method: "POST",
      headers: {
        "X-Hasura-Admin-Secret": "key",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation (
            $content: String!, 
            $last_modified: timestamp!, 
            $metadata: String!, 
            $path: String!, 
            $uuid: uuid!, 
            $version: Int!
          ) {
            insert_zenika_resume_resume(
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

const buildDocumentFromQueryResult = async data => {
  data = data.rows[0];
  data.content = await decrypt(data.content, "");
  return data;
};

const handleResume = async data => {
  if (data.rows.length < 1) {
    console.log("WARNING: EMPTY RESUME");
  } else {
    console.log(data)
    insertResumeIntoDms(await buildDocumentFromQueryResult(data));
  }
};

const handleResumeList = data => {
  const resumeMetadatas = data.rows.map(row => {
    row.metadata = JSON.parse(row.metadata);
    return row;
  });
  resumeMetadatas.map(resumeMetadata => {
    if (!resumeMetadata.path) {
      return;
    }
    executeQueryWithCallback(
      "SELECT id, uuid, content, metadata, path, version, last_modified FROM resume where path=($1) ORDER BY last_modified DESC",
      [resumeMetadata.path],
      handleResume
    );
  });
};

executeQueryWithCallback(
  "SELECT uuid, metadata, path, version, last_modified FROM resume ORDER BY last_modified DESC",
  [],
  handleResumeList
);
