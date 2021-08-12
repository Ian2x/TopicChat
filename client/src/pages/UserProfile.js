import React, { useContext } from 'react'
import { Grid, Transition, Header, List, Card } from 'semantic-ui-react';
import { useQuery } from '@apollo/react-hooks'

import { AuthContext } from '../context/auth'
import TopicCard from '../components/TopicCard'
import TopicForm from '../components/TopicForm'
import { FETCH_USER_QUERY } from '../util/graphql'
import FriendSearch from '../components/FriendSearch'
import FriendSearchAddButton from '../components/FriendSearchAddButton';
import AcceptRejectFriend from '../components/AcceptRejectFriend'
import FriendDeleteButton from '../components/FriendDeleteButton'
import ChatFeed from '../components/ChatFeed'
import DiscoverFeed from '../components/DiscoverFeed'

function UserProfile(props) {
    const userId = props.match.params.userId;
    const { user: loginUser } = useContext(AuthContext);

    const { loading: loadingUser, data: dataUser } = useQuery(FETCH_USER_QUERY, {
        variables: {
            userId
        },
    })

    if (loadingUser) return 'Loading user...';
    const { getUser: user } = dataUser
    var friendRequestSent
    var alreadyFriends
    try {
        friendRequestSent = user.friendRequests.some(friend => friend.userId===loginUser.id)
        alreadyFriends = user.friends.some(friend => friend.userId===loginUser.id)
    } catch (err) {
        console.log(err)
    }

    return (
        <Grid centered celled='internally'>
            <Grid.Row className='page-title'>
                <h1>{user.username}'s topics</h1>
                {loginUser && loginUser.id !== userId && (
                    <FriendSearchAddButton friendUsername={user.username} friendId={user.id} friendRequestSent={friendRequestSent} alreadyFriends={alreadyFriends}/>
                )}
            </Grid.Row>
            {loginUser && loginUser.id === userId && (
                <>
                    <Grid.Row>
                        <Grid.Column width={9}>
                            <TopicForm />
                        </Grid.Column>
                        <Grid.Column width={6}>
                            <h1>
                                Find Friends:
                            </h1>
                            <FriendSearch />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Grid.Row>
                                <h1>
                                    Your Friends:
                                </h1>
                            </Grid.Row>
                            <Grid.Row>
                                <List divided relaxed style={{ height: '100px', overflow: 'scroll' }}>
                                    {
                                        user.friends.length > 0 && user.friends.map((friend) => (
                                            <List.Item key={friend.userId}>
                                                <Card>
                                                    <Card.Content>
                                                        {friend.username}
                                                        <b/>
                                                        <FriendDeleteButton userId = {userId} friendId = {friend.userId}/>
                                                    </Card.Content>
                                                </Card>
                                            </List.Item>
                                        ))
                                    }
                                    {
                                        user.friends.length === 0 && (
                                            <>
                                                You have no friends...
                                            </>
                                        )
                                    }
                                </List>
                            </Grid.Row>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Grid.Row>
                                <h1>
                                    Pending friend requests:
                                </h1>
                            </Grid.Row>
                            <Grid.Row>
                                <List divided relaxed style={{ height: '100px', overflow: 'scroll' }}>
                                    {
                                        user.friendRequests.length > 0 && user.friendRequests.map((friend) => (
                                            <List.Item key={friend.userId}>
                                                <Card>
                                                    <Card.Content>
                                                        <AcceptRejectFriend friendUsername={friend.username} friendId = {friend.userId}/>
                                                    </Card.Content>
                                                </Card>
                                            </List.Item>
                                        ))
                                    }
                                    {
                                        user.friendRequests.length === 0 && (
                                            <div>
                                                No pending friend requests...
                                            </div>
                                        )
                                    }
                                </List>
                            </Grid.Row>
                        </Grid.Column>
                    </Grid.Row>
                </>
            )}

            <Grid.Row columns={3}>
                <Transition.Group>
                    {
                        user.topics && loginUser && user.topics.map((topic) => (
                            <Grid.Column key={topic.keyword}>
                                <TopicCard topic={topic} topicCreatorId={userId} link={`/users/${loginUser.id}/${topic.keyword}`} />
                            </Grid.Column>
                        ))
                    }
                    {
                        user.topics && !loginUser && user.topics.map((topic) => (
                            <Grid.Column key={topic.keyword} link={`/login`}>
                                <TopicCard topic={topic} topicCreatorId={userId} />
                            </Grid.Column>
                        ))
                    }
                </Transition.Group>
            </Grid.Row>
            <Grid.Row>
                {
                    user.topics.length === 0 && (
                        <Grid.Column>
                            <Header size='large' textAlign='center'>
                                {user.username} has no topics...
                            </Header>
                        </Grid.Column>)
                }
            </Grid.Row>
            <Grid.Row columns={2}>
                <Grid.Column>
                    <ChatFeed/>
                </Grid.Column>
                <Grid.Column>
                    <DiscoverFeed/>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}

export default UserProfile;