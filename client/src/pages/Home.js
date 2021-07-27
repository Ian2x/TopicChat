import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Grid } from 'semantic-ui-react';

import UserCard from '../components/UserCard.js';

function Home() {
    // const { user } = useContext(AuthContext);
    const { loading, data } = useQuery(FETCH_USERS_QUERY);
    if (loading) return 'Loading user card...'
    const { getAllUsers } = data;
    const users = getAllUsers

    return(
        <Grid celled='internally'>
            <Grid.Row className='page-title'>
                <h1>All Users</h1>
            </Grid.Row>
            <Grid.Row columns={3}>
                {loading ? (
                    <h1>Loading users</h1>
                ) : (
                    users && users.map((user) => (
                        <Grid.Column key={user.id}>
                            <UserCard user = {user} />
                        </Grid.Column>
                        )
                    )
                )}
            </Grid.Row>
        </Grid>
    )
}

const FETCH_USERS_QUERY = gql`
    {
        getAllUsers{
            id
            username
            createdAt
        }
    }
`
export default Home;