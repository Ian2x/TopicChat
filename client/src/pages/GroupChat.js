import React, { useContext} from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks'
import { List, Message, Header, Icon, Divider, Container, Button } from 'semantic-ui-react';
import moment from 'moment'
import { Link } from 'react-router-dom'


import { AuthContext } from '../context/auth'
import ReplyModal from '../components/ReplyModal'
import { FETCH_USER_QUERY, FETCH_GROUP_CHAT_QUERY, CREATE_TOPIC_MUTATION } from '../util/graphql'
import ChatForm from '../components/ChatForm'
import ChatDeleteButton from '../components/ChatDeleteButton'
import AlwaysScrollToBottom from '../util/AlwaysScrollToBottom'

const _ = require('lodash');

function GroupChat(props) {

    const keyword = props.match.params.keyword;
    const pageUserId = props.match.params.userId;
    const { user } = useContext(AuthContext);

    const {loading: loadingUser, data: dataUser} = useQuery(FETCH_USER_QUERY, {
        variables: {
            'userId': user.id
        },
    })

    const { loading, data } = useQuery(FETCH_GROUP_CHAT_QUERY, {
        variables: {
            keyword
        },
    })

    const [createTopic] = useMutation(CREATE_TOPIC_MUTATION, {
        variables: {
            keyword
        },
        update(cache, result) {
            const data = _.cloneDeep(
                cache.readQuery({
                    query: FETCH_USER_QUERY,
                    variables: {userId: user.id}
                })
            )
            data.getUser.topics = [...data.getUser.topics, result.data.createTopic]
            cache.writeQuery({
                query: FETCH_USER_QUERY,
                data: {...data},
                variables: {userId: user.id}
            });
        },
        onError(err) {
            console.log(err)
        },

        refetchQueries: [
            {
                query: FETCH_USER_QUERY
                ,
                variables: {userId: user.id}
            }
        ]
    })

    if (!user || user.id !== pageUserId) return 'Not allowed to view'

    if (loading || loadingUser) return 'Loading groupchat...';
    const { getUser } = dataUser
    const { getGroupChat } = data;

    const addedGroupChat = getUser.topics.some(t => t.keyword === keyword)
    console.log(getGroupChat)
    return (
        <>
            <Header as='h1' icon textAlign='center'>
                <Icon name='users' size='small'/>
                <Header.Content>{keyword}</Header.Content>
            </Header>
            <Button as={Link} to={`/users/${user.id}`}>
                Back
            </Button>
            { !addedGroupChat && (
                <Button onClick={createTopic}>
                    like
                </Button>
            )}
            <List divided relaxed style={{ height: '700px', overflow: 'scroll' }}>
                {
                    getGroupChat && getGroupChat.map((chat) => (
                        <List.Item key={chat.id}>
                            <List.Content style={{ padding: '5px' }}>
                                <Message color='teal' style={{ paddingBottom: '15px' }}>
                                    <Message.Header>
                                        {chat.chat}
                                    </Message.Header>
                                    <Message.Item>
                                        <div style={{ float: 'left' }}>
                                            {chat.username}
                                        </div>
                                        <div style={{ float: 'right' }}>
                                            {moment(chat.createdAt).fromNow()}
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
                                            <ChatDeleteButton keyword={keyword} chatId={chat.id} />)}
                                    </Message.Item>
                                    <ReplyModal chat={chat} keyword={keyword} />

                                </Message>
                            </List.Content>
                        </List.Item>
                    ))
                }
                {
                    getGroupChat.length === 0 && (
                        <List.Item>
                            <List.Content style={{ padding: '5px' }}>
                                <Message color='teal' style={{ paddingBottom: '15px' }}>
                                    <Message.Header>
                                        No messages yet, be the first!
                                    </Message.Header>
                                </Message>
                            </List.Content>
                        </List.Item>
                    )
                }
                <AlwaysScrollToBottom />
            </List>
            <Container style={{ paddingBottom: '100px' }}>
                <ChatForm keyword={keyword} />
            </Container>
        </>
    )
}

/*
<h1 style={{textAlign: 'center'}}>
    No messages yet
</h1>
*/

export default GroupChat;