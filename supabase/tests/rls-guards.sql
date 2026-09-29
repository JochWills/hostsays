-- Integrity + privilege test: reserved slugs, self-recommendation, money checks, forbidden updates, admin reads. Rolls back.
-- Needs seed data (npm run db:seed). Run: npm run db:test
begin;
create temp table results (check_name text, value text);
grant all on results to authenticated;
insert into auth.users (id, email, aud, role) values ('22222222-2222-4222-8222-222222222222','o@example.com','authenticated','authenticated');
insert into public.profiles (id, role) values ('22222222-2222-4222-8222-222222222222','operator');
insert into public.operator_members values ('5eed0000-0000-4000-8000-b00000000002','22222222-2222-4222-8222-222222222222',true);
-- Same user is also a member of On The Bay (host) -> must not be able to recommend Pro Dive's experience.
insert into public.host_members values ('5eed0000-0000-4000-8000-d00000000003','22222222-2222-4222-8222-222222222222',false);

do $$ begin
  begin insert into public.hosts (slug,name,type) values ('explore','X','bnb'); insert into results values ('reserved slug','ACCEPTED (bad)');
  exception when others then insert into results values ('reserved slug', 'rejected: '||sqlerrm); end;
  begin insert into public.hosts (slug,name,type) values ('gqeberha','X','bnb'); insert into results values ('host slug = area','ACCEPTED (bad)');
  exception when others then insert into results values ('host slug = area', 'rejected: '||sqlerrm); end;
  begin delete from public.recommendations where host_id='5eed0000-0000-4000-8000-d00000000003' and experience_id='5eed0000-0000-4000-8000-c00000000002';
        insert into public.recommendations (host_id, experience_id, tip) values ('5eed0000-0000-4000-8000-d00000000003','5eed0000-0000-4000-8000-c00000000002','mine');
        insert into results values ('recommend own experience','ACCEPTED (bad)');
  exception when others then insert into results values ('recommend own experience', 'rejected: '||sqlerrm); end;
  begin insert into public.bookings (reference, token, experience_id, operator_id, date, start_time, people, guest_name, guest_email, guest_phone,
    unit_price_cents, total_cents, deposit_cents, platform_cents, balance_cents, respond_by)
    values ('HS-BAD', repeat('t',43), '5eed0000-0000-4000-8000-c00000000002','5eed0000-0000-4000-8000-b00000000002', current_date+3,'08:00',1,'A','a@example.com','1',
    100000, 100000, 10000, 9000, 90000, now());
    insert into results values ('money not adding up','ACCEPTED (bad)');
  exception when others then insert into results values ('money not adding up', 'rejected: '||sqlerrm); end;
end $$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$ begin
  begin perform token from public.bookings; insert into results values ('operator reads token','ALLOWED (bad)');
  exception when others then insert into results values ('operator reads token', 'denied: '||sqlerrm); end;
  begin update public.experiences set status='live' where operator_id='5eed0000-0000-4000-8000-b00000000002'; insert into results values ('operator sets status','ALLOWED (bad)');
  exception when others then insert into results values ('operator sets status', 'denied: '||sqlerrm); end;
  begin update public.hosts set status='verified'; insert into results values ('host self-verifies','ALLOWED (bad)');
  exception when others then insert into results values ('host self-verifies', 'denied: '||sqlerrm); end;
end $$;

reset role;
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role='admin' limit 1), 'role','authenticated')::text, true);
set local role authenticated;
insert into results select 'admin: host_private rows', count(*)::text from public.host_private;
insert into results select 'admin: operator_private rows', count(*)::text from public.operator_private;
reset role;
select * from results;
rollback;
