import React, { useState } from 'react'
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'

import { Button, Icon, Confirm, Popup } from 'semantic-ui-react'

import { FETCH_GROUP_CHAT_QUERY } from '../util/graphql'


const _ = require('lodash');

function ReplyDeleteButton({ chatUserId, keyword, chatId, replyId, replyUser }) {

    const [confirmOpen, setConfirmOpen] = useState(false)

    const [deleteReply] = useMutation(DELETE_REPLY_MUTATION, {
        update(proxy) {
            setConfirmOpen(false)
            
            const data = _.cloneDeep(
                proxy.readQuery({
                    query: FETCH_GROUP_CHAT_QUERY,
                    variables: {
                        keyword
                    }
                })
            )
            const index = data.getGroupChat.findIndex((chat)=>chat.id===chatId)
            data.getGroupChat[index].replies = [...data.getGroupChat[index].replies.filter(r => r.id !== replyId)]

            proxy.writeQuery({
                query: FETCH_GROUP_CHAT_QUERY,
                data,
                variables: {
                    keyword
                }
            })
        },
        variables: {
            chatUserId,
            keyword,
            chatId,
            replyId,
            replyUser
        },

        onError(err) {
            throw new Error(err)
        },
        
        refetchQueries: [
            {
                query: FETCH_GROUP_CHAT_QUERY
                ,
                variables: { keyword }
            }
        ]
        
    })

    return (
        <>
            <Popup content="Delete reply" inverted trigger={
                <Button as='div' color='red' style={{ marginLeft: 'auto' }} onClick={() => setConfirmOpen(true)}>
                    <Icon name='trash' style={{ margin: 0 }} />
                </Button>
            } />
            <Confirm
                open={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={deleteReply}
            />
        </>
    )

}

const DELETE_REPLY_MUTATION = gql`
    mutation deleteReply($chatUserId: ID!, $keyword: String!, $chatId: ID!, $replyId: ID!, $replyUser: ID!) {
        deleteReply(chatUserId: $chatUserId, keyword: $keyword, chatId: $chatId, replyId: $replyId, replyUser: $replyUser)
    }
`

export default ReplyDeleteButton