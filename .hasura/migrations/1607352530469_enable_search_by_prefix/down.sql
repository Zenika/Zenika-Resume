drop function if exists search_resume;

create function search_resume(search text) returns setof resume as $$ 
    select resume.*
    from latest_resume
    join resume using (uuid, version_date)
    where resume.full_text_search_vector @@ websearch_to_tsquery(search)
    order by 
        ts_rank_cd(resume.full_text_search_vector, websearch_to_tsquery(search)) desc,
        resume.last_modified desc
$$ language sql stable;
