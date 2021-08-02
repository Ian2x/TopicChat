import React, { useState } from 'react'
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'

import { Button, Icon, Confirm, Popup } from 'semantic-ui-react'

import { FETCH_GROUP_CHAT_QUERY } from '../util/graphql'


const _ = require('lodash');

function ChatDeleteButton({ keyword, chatId }) {

    const [confirmOpen, setConfirmOpen] = useState(false)

    const [deleteChat] = useMutation(DELETE_CHAT_MUTATION, {
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

            data.getGroupChat = [...data.getGroupChat.filter(c => c.id !== chatId)]
            data.getGroupChat.reverse()

            proxy.writeQuery({
                query: FETCH_GROUP_CHAT_QUERY,
                data,
                variables: {
                    keyword
                }
            })
        },
        variables: {
            keyword,
            chatId,
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
                onConfirm={deleteChat}
            />
        </>
    )

}

const DELETE_CHAT_MUTATION = gql`
    mutation deleteChat($keyword: String!, $chatId: ID!) {
        deleteChat(keyword: $keyword, chatId: $chatId)
    }
`

export default ChatDeleteButton

// deleteChat(keyword: String!, chatId: ID!): String!
