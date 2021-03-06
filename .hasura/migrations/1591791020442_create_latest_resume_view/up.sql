
CREATE OR REPLACE VIEW latest_resume AS
  (SELECT resume.uuid,
          metadata,
          content,
          PATH,
          VERSION,
          last_modified,
          version_date
   FROM resume
   INNER JOIN
     (SELECT uuid,
             max(version_date) AS max_version_date
      FROM resume
      GROUP BY uuid) AS grouped_resume ON resume.uuid = grouped_resume.uuid
   AND resume.version_date = grouped_resume.max_version_date)