import React, { useContext} from 'react';
import { useQuery } from '@apollo/react-hooks'
import { List, Message, Header, Icon, Divider, Container } from 'semantic-ui-react';
import moment from 'moment'


import { AuthContext } from '../context/auth'
import ReplyModal from '../components/ReplyModal'
import { FETCH_GROUP_CHAT_QUERY } from '../util/graphql'
import ChatForm from '../components/ChatForm'
import ChatDeleteButton from '../components/ChatDeleteButton'
import AlwaysScrollToBottom from '../util/AlwaysScrollToBottom'

function GroupChat(props) {

    const keyword = props.match.params.keyword;
    const pageUserId = props.match.params.userId;
    const { user } = useContext(AuthContext);

    const { loading, data } = useQuery(FETCH_GROUP_CHAT_QUERY, {
        variables: {
            keyword
        },
    })

    /*
    const AlwaysScrollToBottom = () => {
        const elementRef = useRef();
        useEffect(() => elementRef.current.scrollIntoView());
        return <div ref={elementRef} />;
    };
    */


    if (!user || user.id !== pageUserId) return 'Not allowed to view'

    if (loading) return 'Loading groupchat...';

    const { getGroupChat } = data;

    return (
        <>
            <Header as='h2' icon textAlign='center'>
                <Icon name='users' circular />
                <Header.Content>{keyword}</Header.Content>
            </Header>
            <List divided relaxed style={{ height: '700px', overflow: 'scroll' }}>
                {
                    getGroupChat && getGroupChat.reverse().map((chat) => (
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