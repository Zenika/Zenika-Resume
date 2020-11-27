create function to_tsvector_multilang(text) returns tsvector as $$
select to_tsvector('french', $1) || 
       to_tsvector('english', $1)
$$ language sql immutable;

alter table resume
    add column full_text_search_vector tsvector
        generated always as (
            setweight(to_tsvector('simple', metadata), 'A') 
            || setweight(to_tsvector_multilang(content), 'C')
        ) stored;

create index resume_full_text_search_idx on resume using gin(full_text_search_vector);

create function search_resume(search text) returns setof resume as $$ 
    select resume.*
    from latest_resume
    join resume using (uuid, version_date)
    where resume.full_text_search_vector @@ websearch_to_tsquery(search)
    order by 
        ts_rank_cd(resume.full_text_search_vector, websearch_to_tsquery(search)) desc,
        resume.last_modified desc
$$ language sql stable;
