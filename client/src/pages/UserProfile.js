import React, { useContext } from 'react'
import { Grid, Transition, Header } from 'semantic-ui-react';
import { useQuery } from '@apollo/react-hooks'

import { AuthContext } from '../context/auth'
import TopicCard from '../components/TopicCard'
import TopicForm from '../components/TopicForm'
import { FETCH_USER_QUERY } from '../util/graphql'
import FriendSearch from '../components/FriendSearch'

function UserProfile(props) {
    const userId = props.match.params.userId;
    const { user: loginUser } = useContext(AuthContext);

    const { loading: loadingUser, data: dataUser } = useQuery(FETCH_USER_QUERY, {
        variables: {
            userId
        },
    })

    if (loadingUser) return 'Loading user...';
    const { getUser: { username } } = dataUser;
    const { getUser: { topics } } = dataUser;
    return (
        <Grid centered celled='internally'>
            <Grid.Row className='page-title'>
                <h1>{username}'s topics</h1>
            </Grid.Row>
            {loginUser && loginUser.id === userId && (
                <Grid.Row>
                    <Grid.Column width={9}>
                        <TopicForm/>
                    </Grid.Column>
                    <Grid.Column width={6}>
                        <FriendSearch/>
                    </Grid.Column>
                </Grid.Row>
            )}
            
            <Grid.Row columns={3}>
                <Transition.Group>
                    {
                        topics && loginUser && topics.map((topic) => (
                            <Grid.Column key={topic.keyword}>
                                <TopicCard topic={topic} topicCreatorId={userId} link={`/users/${loginUser.id}/${topic.keyword}`}/>
                            </Grid.Column>
                        ))
                    }
                    {
                        topics && !loginUser && topics.map((topic) => (
                            <Grid.Column key={topic.keyword} link={`/login`}>
                                <TopicCard topic={topic} topicCreatorId={userId} />
                            </Grid.Column>
                        ))
                    }
                </Transition.Group>
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