-- Rename Lesson → Topic across the schema. Lessons are now generated slices;
-- the persistent grouping is the Topic. RLS policies are tied to the table
-- itself and survive the rename.

alter table public.sessions rename column lesson_id to topic_id;

alter table public.completed_lessons rename to completed_topics;
alter table public.completed_topics rename column lesson_id to topic_id;
