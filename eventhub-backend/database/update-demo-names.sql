-- Update existing demo identities only. Preserve accounts, emails and registrations.
BEGIN;
UPDATE users SET full_name='Nouhaila Mouhly'
WHERE id='10000000-0000-4000-8000-000000000001' AND email='admin@eventhub.demo';
UPDATE users SET full_name='Yassine Bennani'
WHERE id='10000000-0000-4000-8000-000000000002' AND email='staff@eventhub.demo';
UPDATE participants p SET full_name=names.full_name
FROM (VALUES
 ('30000000-0000-4000-8000-000000000001'::uuid,'Sofia Bennani'),
 ('30000000-0000-4000-8000-000000000002'::uuid,'Adam El Amrani'),
 ('30000000-0000-4000-8000-000000000003'::uuid,'Lina El Fassi'),
 ('30000000-0000-4000-8000-000000000004'::uuid,'Omar Idrissi'),
 ('30000000-0000-4000-8000-000000000005'::uuid,'Salma El Mansouri'),
 ('30000000-0000-4000-8000-000000000006'::uuid,'Youssef Alami'),
 ('30000000-0000-4000-8000-000000000007'::uuid,'Nora Alaoui'),
 ('30000000-0000-4000-8000-000000000008'::uuid,'Amine Berrada'),
 ('30000000-0000-4000-8000-000000000009'::uuid,'Sara Benjelloun'),
 ('30000000-0000-4000-8000-000000000010'::uuid,'Mehdi Tazi')
) AS names(id,full_name) WHERE p.id=names.id;
COMMIT;
