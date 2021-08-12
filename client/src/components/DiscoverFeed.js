import React, { useContext } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { List, Message, Divider, Header, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/auth'


function DiscoverFeed() {

    const { user } = useContext(AuthContext);

    const { loading, data } = useQuery(FETCH_NEW_SUGGESTED_TOPICS_QUERY, {
        variables: { },
    })

    if (loading) return 'Loading topic suggestions...';
    const { getNewSuggestedTopics } = data
    return (
        <Grid>
            <Grid.Column>
                <Header as='h1' icon textAlign='center'>
                    <Header.Content>Discover Topics: </Header.Content>
                </Header>
                <List divided relaxed style={{ height: '700px', width: '400px', overflow: 'scroll' }}>
                    {
                        getNewSuggestedTopics && getNewSuggestedTopics.map(topic=> (
                            <List.Item key={topic.keyword}>
                                <List.Header as={Link} to={`/users/${user.id}/${topic.keyword}`}>
                                    {topic.keyword}
                                </List.Header>
                                <List.Content style={{ padding: '5px' }}>
                                    <Message color='teal' style={{ paddingBottom: '15px' }}>
                                        <Message.Header>
                                            {topic.keyword}
                                        </Message.Header>
                                        <Message.Item>
                                            <div style={{ float: 'right' }}>
                                                number of chats: {topic.totalChats}
                                            </div>
                                        </Message.Item>
                                        <br />
                                        <Divider />
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


const FETCH_NEW_SUGGESTED_TOPICS_QUERY = gql`
    query getNewSuggestedTopics {
        getNewSuggestedTopics {
            keyword
            totalChats
        }
    }
`

export default DiscoverFeed