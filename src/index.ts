import {
  Collection,
  Entity,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  PrimaryKeyType,
  RequestContext,
  RequiredEntityData
} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';

@Entity()
export class Group {
  @PrimaryKey()
  public id: number;

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: (member) => member.group,
    eager: true,
    orphanRemoval: true
  })
  public members = new Collection<GroupMember>(this);

  constructor(params: RequiredEntityData<Group>) {
    Object.assign(this, params);
  }
}

@Entity()
export class GroupMember {
  @ManyToOne({
    entity: () => Member,
    inversedBy: (member) => member.groups,
    primary: true,
    wrappedReference: true,
    onDelete: 'cascade',
    onUpdateIntegrity: 'no action'
  })
  public member!: IdentifiedReference<Member>;

  @ManyToOne({
    entity: () => Group,
    inversedBy: (group) => group.members,
    primary: true,
    wrappedReference: true,
    onDelete: 'cascade',
    onUpdateIntegrity: 'no action'
  })
  public group!: IdentifiedReference<Group>;

  public [PrimaryKeyType]!: [number, number];
  public [PrimaryKeyProp]!: 'member' | 'group';

  constructor(params: RequiredEntityData<GroupMember>) {
    Object.assign(this, params);
  }
}

@Entity()
export class Member {
  @PrimaryKey()
  public id: number;

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: (group) => group.member,
    eager: true,
    orphanRemoval: true
  })
  public groups = new Collection<GroupMember>(this);

  constructor(params: RequiredEntityData<Member>) {
    Object.assign(this, params);
  }
}

const entrypoint = async () => {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Group, Member, GroupMember],
    contextName: 'pg',
    validateRequired: true,
    debug: true,
    clientUrl: 'postgresql://user:password@localhost:5432/test',
    type: 'postgresql',
  });
  const {em} = orm;

  const clean = async (dispose: boolean = false): Promise<void> => {
    await em.nativeDelete(GroupMember, {});
    await em.nativeDelete(Member, {});
    await em.nativeDelete(Group, {});

    if (dispose) {
      await orm.close();
    }
  };

  try {
    // Before each
    await clean();
    const groupId = 1;
    const memberId = 2;

    // Arrange
    console.log('Arrange');
    await RequestContext.createAsync(em, () =>
      em.transactional(async () => {
        const group = new Group({id: groupId});
        const member = new Member({id: memberId});

        member.groups.add(new GroupMember({
          group,
          member
        }));

        em.persist([group, member]);
      }));

    // Act
    console.log('Act');
    await RequestContext.createAsync(em, () =>
      em.transactional(async () => {
        await em.findOne(Group, groupId);

        const member = await em.findOne(Member, memberId);
        em.assign(member, {
          groups: []
        });

        em.persist(member);

        await em.findOne(Member, memberId);
      }));

    // Assert
    console.log('Assert');
    await RequestContext.createAsync(em, () =>
      em.transactional(async () => {
        console.log(await em.findOne(Member, memberId));
        console.log(await em.findOne(Group, groupId));
      }));
  } catch (e) {
    console.log(e);
  } finally {
    // After each
    await clean(true);
  }
};

entrypoint();
