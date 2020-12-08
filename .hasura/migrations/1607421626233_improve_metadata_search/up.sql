alter table resume
    drop column full_text_search_vector;

alter table resume
    add column full_text_search_vector tsvector
        generated always as (
            setweight(to_tsvector_multilang(metadata), 'A') 
            || setweight(to_tsvector_multilang(content), 'C')
        ) stored;
