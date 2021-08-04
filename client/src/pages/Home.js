import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Grid } from 'semantic-ui-react';

import UserCard from '../components/UserCard.js';
import { FETCH_ALL_USERS_QUERY } from '../util/graphql.js';

function Home() {
    // const { user } = useContext(AuthContext);
    const { loading, data } = useQuery(FETCH_ALL_USERS_QUERY);
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

export default Home;