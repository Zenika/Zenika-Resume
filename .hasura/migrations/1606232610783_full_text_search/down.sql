drop function if exists search_resume;

drop index if exists resume_full_text_search_idx;

alter table resume
    drop column full_text_search_vector;

drop function if exists to_tsvector_multilang;
