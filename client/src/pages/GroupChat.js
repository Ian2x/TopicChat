import React, { useContext } from 'react';
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag';
import { List, Message, Popup, Header, Icon, Divider } from 'semantic-ui-react';
import moment from 'moment'


import { AuthContext } from '../context/auth'
import ReplyModal from '../components/ReplyModal'

function GroupChat(props) {
    const keyword = props.match.params.keyword;
    const pageUserId = props.match.params.userId;
    const { user } = useContext(AuthContext);

    const { loading, data } = useQuery(FETCH_GROUP_CHAT_QUERY, {
        variables: {
            keyword
        },
    })

    if(!user || user.id !== pageUserId) return 'Not allowed to view'

    if (loading) return 'Loading groupchat...';

    const { getGroupChat } = data;

    if(getGroupChat.length===0) return 'no messages in this groupchat'

    console.log(getGroupChat)

    return(
        <>
            <Header as='h2' icon textAlign='center'>
                <Icon name='users' circular />
                <Header.Content>{keyword}</Header.Content>
            </Header>
            <List divided relaxed>
                {
                    getGroupChat && getGroupChat.map((chat) => (
                        <List.Item key = {chat.id}>
                            <List.Content style={{padding: '10px'}}>
                                <Message color='teal'style={{paddingBottom: '35px'}}>
                                    <Message.Header>
                                        {chat.chat}
                                    </Message.Header>
                                    <Message.Item>
                                        <div style={{float: 'left'}}>
                                            {chat.username}
                                        </div>
                                        <div style={{float: 'right'}}>
                                            {moment(chat.createdAt).fromNow()}
                                        </div>
                                    </Message.Item>
                                    <br/>
                                    <Divider/>
                                    <Message.Item>
                                        {
                                            chat.replies.length>0 && (
                                                <div>
                                                    {chat.replies[0].reply}
                                                </div>
                                            )
                                        }
                                        {
                                            chat.replies.length>1 && (
                                                <div>
                                                    {chat.replies[1].reply}
                                                </div>
                                            )
                                        }
                                    </Message.Item>
                                    <br/>
                                    <ReplyModal chat={chat} keyword={keyword} replierId = {user.id}/>
  
                                </Message>
                            </List.Content>
                        </List.Item>
                    ))
                }
            </List>
        </>
    )
}

const FETCH_GROUP_CHAT_QUERY = gql`
query getGroupChat($keyword: String!) {
    getGroupChat(keyword: $keyword) {
        id
        user
        username
        replies {
            reply
        }
        chat
        createdAt
    }
}
`

export default GroupChat;