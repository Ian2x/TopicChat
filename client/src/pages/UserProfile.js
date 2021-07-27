import React, { useContext } from 'react'
import { Grid, Transition, Header } from 'semantic-ui-react';
import { useQuery } from '@apollo/react-hooks'

import { AuthContext } from '../context/auth'
import TopicCard from '../components/TopicCard'
import TopicForm from '../components/TopicForm'
import { FETCH_USER_QUERY } from '../util/graphql'

function UserProfile(props) {
    const userId = props.match.params.userId;
    const { user: loginUser } = useContext(AuthContext);

    console.log(userId)

    const { loading: loadingUser, data: dataUser } = useQuery(FETCH_USER_QUERY, {
        variables: {
            userId
        },
    })

    if (loadingUser) return 'Loading user...';
    console.log("dataUser:\n", dataUser)
    const { getUser: { username } } = dataUser;
    const { getUser: { topics } } = dataUser;

    console.log(username)
    console.log(topics)

    return (
        <Grid celled='internally'>
            <Grid.Row className='page-title'>
                <h1>{username}'s topics</h1>
            </Grid.Row>
            {loginUser && loginUser.id === userId && (
                <Grid.Row>
                    <Grid.Column>
                        <TopicForm userId={userId} />
                    </Grid.Column>
                </Grid.Row>
            )}
            <Grid.Row columns={3}>
                {loadingUser ? (
                    <h1>Loading topics</h1>
                ) : (
                    <Transition.Group>
                        {
                            topics && topics.map((topic) => (
                                <Grid.Column key={topic.keyword}>
                                    <TopicCard topic={topic} topicCreatorId={userId} />
                                </Grid.Column>
                            ))
                        }
                    </Transition.Group>
                )
                }
            </Grid.Row>
            <Grid.Row>
                {
                    topics.length === 0 && (
                    <Grid.Column>
                        <Header size='large' textAlign='center'>
                            {username} has no topics...
                        </Header>
                    </Grid.Column>)
                }
            </Grid.Row>
        </Grid>
    )
}

export default UserProfile;