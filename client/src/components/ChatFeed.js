import React, { useContext } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { List, Message, Divider, Header, Grid } from 'semantic-ui-react';
import moment from 'moment'
import gql from 'graphql-tag'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/auth'
import ChatDeleteButton from '../components/ChatDeleteButton'


function ChatFeed() {

    const { user } = useContext(AuthContext);

    const { loading, data } = useQuery(FETCH_USER_FEED_QUERY, {
        variables: { },
    })

    if (loading) return 'Loading feed...';
    console.log(data)
    const { getUserFeed } = data
    console.log(getUserFeed)
    return (
        <Grid>
            <Grid.Column>
                <Header as='h1' icon textAlign='center'>
                    <Header.Content>Your feed: </Header.Content>
                </Header>
                <List divided relaxed style={{ height: '700px', width: '600px', overflow: 'scroll' }}>
                    {
                        getUserFeed && getUserFeed.map(chat=> (
                            <List.Item key={chat.id}>
                                <List.Header as={Link} to={`/users/${user.id}/${chat.parentTopic}`}>
                                    {chat.parentTopic}
                                </List.Header>
                                <List.Content style={{ padding: '5px' }}>
                                    <Message color='teal' style={{ paddingBottom: '15px' }}>
                                        <Message.Header>
                                            {chat.chat}
                                        </Message.Header>
                                        <Message.Item>
                                            <div style={{ float: 'left' }}>
                                                {chat.username}
                                                {chat.username===user.username && (
                                                    <>
                                                        &nbsp;(you)
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ float: 'right' }}>
                                                {moment(chat.createdAt).fromNow()}
                                                &nbsp;| number of replies: {chat.replyCount}
                                            </div>
                                        </Message.Item>
                                        <br />
                                        <Divider />
                                        <Message.Item>
                                            {
                                                chat.replies.length > 0 && (
                                                    <div>
                                                        {chat.replies[0].reply}
                                                    </div>
                                                )
                                            }
                                            {
                                                chat.replies.length > 1 && (
                                                    <>
                                                        <div>
                                                            {chat.replies[1].reply}
                                                        </div>
                                                        <div>
                                                            ...
                                                        </div>
                                                    </>
                                                )
                                            }
                                            {user && user.id === chat.user && (
                                                <ChatDeleteButton keyword={chat.parentTopic} chatId={chat.id} />)}
                                        </Message.Item>

                                    </Message>
                                </List.Content>
                            </List.Item>
                        ))
                    }
                </List>
            </Grid.Column>
        </Grid>
    )
}


const FETCH_USER_FEED_QUERY = gql`
    query getUserFeed {
        getUserFeed {
            id
            user
            username
            replies {
                id
                user
                username
                reply
                createdAt
            }
            replyCount
            chat
            createdAt
            parentTopic
        }
    }
`

export default ChatFeed