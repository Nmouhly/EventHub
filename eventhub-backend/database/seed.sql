-- Run via npm run db:seed: the script supplies a bcrypt hash through set_config.
INSERT INTO users(id,full_name,email,password_hash,role) VALUES
('10000000-0000-4000-8000-000000000001','Alex Morgan','admin@eventhub.demo',current_setting('eventhub.seed_password_hash'),'admin'),
('10000000-0000-4000-8000-000000000002','Sam Bennani','staff@eventhub.demo',current_setting('eventhub.seed_password_hash'),'staff');

INSERT INTO events(id,title,description,location,event_date,max_participants,status,created_by,cancelled_at) VALUES
('20000000-0000-4000-8000-000000000001','Design Forward 2026','A day of fresh perspectives and thoughtful design.','The Glasshouse, Casablanca',now()+interval '5 days',40,'published','10000000-0000-4000-8000-000000000001',NULL),
('20000000-0000-4000-8000-000000000002','The Creative Meetup','Connect with our local creative community.','Studio 14, Rabat',now()+interval '9 days',20,'published','10000000-0000-4000-8000-000000000002',NULL),
('20000000-0000-4000-8000-000000000003','Build with React','An interactive workshop for curious developers.','Innovation Hub, Casablanca',now()+interval '14 days',30,'draft','10000000-0000-4000-8000-000000000001',NULL),
('20000000-0000-4000-8000-000000000004','Founders & Friends','An evening of honest conversations.','Le Rooftop, Marrakech',now()+interval '18 days',25,'cancelled','10000000-0000-4000-8000-000000000002',now()),
('20000000-0000-4000-8000-000000000005','Product Thinking Lab','Discover meaningful product problems.','Online',now()+interval '23 days',50,'published','10000000-0000-4000-8000-000000000001',NULL);

INSERT INTO participants(id,full_name,email,phone)
SELECT ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid, name,
lower(replace(name,' ','.'))||'@example.com', '+2126000000'||lpad(n::text,2,'0')
FROM unnest(ARRAY['Sofia Bennani','Adam El Amrani','Lina Martin','Omar Idrissi','Emma Laurent','Youssef Alami','Nora Dupont','Amine Berrada','Sarah Wilson','Mehdi Tazi']) WITH ORDINALITY AS people(name,n);

INSERT INTO registrations(event_id,participant_id,status,cancelled_at)
SELECT '20000000-0000-4000-8000-000000000001',('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
CASE WHEN n%3=0 THEN 'pending' ELSE 'confirmed' END,NULL FROM generate_series(1,8) n;
INSERT INTO registrations(event_id,participant_id,status,cancelled_at)
SELECT '20000000-0000-4000-8000-000000000002',('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
CASE WHEN n%2=0 THEN 'pending' ELSE 'confirmed' END,NULL FROM generate_series(1,7) n;
INSERT INTO registrations(event_id,participant_id,status,cancelled_at)
SELECT '20000000-0000-4000-8000-000000000004',('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
'cancelled',now() FROM generate_series(1,5) n;
