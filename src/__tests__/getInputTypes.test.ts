import { expect } from 'chai';
import getPerson from '../__fakes__/getPerson';
import getProfileData from '../__fakes__/getProfileFields';
import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import getTypes from '../getTypes';
import getInputTypes from '../getInputTypes';
import { Collision, RoleType, ScopeType } from 'schemaly';

const resolveForPerson = async (data: any) => {
  const model = getPerson(() => ({}));
  const collider = Collision({
    model,
    scope: ['r'],
    roles: ['guest']
  });
  return collider
    .with(data)
    .collide()
    .then(collider.dump);
};

const getSchema = async ({ roles, scope }: { roles: RoleType[]; scope: ScopeType[] }) => {
  const models = [getPerson(getProfileData())];
  const queries: any = await getTypes({
    models,
    roles,
    scope,
    options: {}
  });
  const mutators: any = await getInputTypes({
    models,
    roles,
    scope,
    options: {}
  });
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queries
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutations',
      fields: () => ({
        createPerson: {
          type: queries.person.type,
          args: {
            value: { type: mutators.personInput.type }
          },
          resolve: async () => {
            const resolved = await resolveForPerson({ _id: 3233, firstName: 'Ryan', surname: 'BLAH' });
            console.log(resolved);
            return resolved;
          }
        }
      })
    })
  });
};

describe('getInputTypes', () => {
  it('can mutate data', async () => {
    const fakeQuery = `
      mutation {
        createPerson(
        value: {
            _id: 333232
            firstName: "Richard"
          }
        ) {
          _id
          firstName
          surname
        }
      }
    `;
    const fakeResult = await graphql({
      schema: await getSchema({
        roles: ['guest'],
        scope: ['r', 'w']
      }),
      source: fakeQuery
    });
    console.log();
  });
});
