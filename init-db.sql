create table "member" ("id" serial NOT NULL, constraint "member_pkey" primary key ("id"));
create table "group" ("id" serial NOT NULL, constraint "group_pkey" primary key ("id"));
create table "group_member" ("member_id" int NOT NULL, "group_id" int NOT NULL, constraint "group_member_pkey" primary key ("member_id", "group_id"));
alter table "group_member" add constraint "group_member_member_id_foreign" foreign key ("member_id") references "member" ("id") on update no action on delete cascade;
alter table "group_member" add constraint "group_member_group_id_foreign" foreign key ("group_id") references "group" ("id") on update no action on delete cascade;
