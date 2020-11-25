
ALTER TABLE "public"."resume"
DROP CONSTRAINT "resume_pkey";
ALTER TABLE public.resume ADD CONSTRAINT resume_pkey PRIMARY KEY (UUID,
version_date)