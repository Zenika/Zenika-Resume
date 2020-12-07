drop function if exists search_resume;

create function search_resume(search text) returns setof resume as $$ 
    select resume.*
    from 
        latest_resume
            join resume using (uuid, version_date),
        websearch_to_tsquery(search) as query
    where 
        resume.full_text_search_vector @@ query
        or resume.metadata ilike '%' || search || '%'
        or resume.content ilike '%' || search || '%'
    order by 
        ts_rank_cd(resume.full_text_search_vector, query) desc,
        resume.last_modified desc
$$ language sql stable;
