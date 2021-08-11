import gql from 'graphql-tag'
import React, { useState } from 'react'
import { Button, Form } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'

import { FETCH_GROUP_CHAT_QUERY } from '../util/graphql'
import { useForm } from '../util/hooks'

const _ = require('lodash');

function ReplyForm({chatUserId, keyword, chatId}){

    const [errors, setErrors] = useState({});

    const { values, onChange, onSubmit } = useForm(createReplyCallback, {
        reply: '',
    })

    const [replyToChat] = useMutation(REPLY_TO_CHAT_MUTATION, {
        variables: {...values, chatUserId, keyword, chatId},
        update(cache, result) {
            const data = _.cloneDeep(
                cache.readQuery({
                    query: FETCH_GROUP_CHAT_QUERY,
                    variables: {keyword: keyword}
                })
            )
            const index = data.getGroupChat.findIndex((chat)=>chat.id===chatId)
            data.getGroupChat[index].replies = [...data.getGroupChat[index].replies, result.data.replyToChat]
            cache.writeQuery({
                query: FETCH_GROUP_CHAT_QUERY,
                data: {...data},
                variables: {keyword: keyword}
            });

            values.reply = ''
            setErrors('')           
        },
        onError(err) {
            console.log(err)
            setErrors(err.graphQLErrors[0].extensions.exception.errors);
        },

        refetchQueries: [
            {
                query: FETCH_GROUP_CHAT_QUERY
                ,
                variables: {keyword: keyword}
            }
        ]
    })

    function createReplyCallback() {
        replyToChat()
    }

    return(
        <>
            <Form onSubmit={onSubmit}>
                <h2> Reply to chat: </h2>
                <Form.Field>
                    <Form.Input
                        placeholder='Reply...'
                        name='reply'
                        onChange={onChange}
                        value={values.reply}
                    />
                    <Button type='submit' color='teal' onClick = {e => e.target.blur()}>
                        Submit
                    </Button>
                </Form.Field>
            </Form>
            {Object.keys(errors).length > 0 && (
                <div className='ui error message'>
                    <ul className='list'>
                        {Object.values(errors).map(value => (
                            <li key={value}> { value } </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    )
}

const REPLY_TO_CHAT_MUTATION = gql`
mutation replyToChat($chatUserId: ID!, $keyword: String!, $chatId: ID!, $reply: String!) {
    replyToChat(chatUserId: $chatUserId, keyword: $keyword, chatId: $chatId, reply: $reply) {
        id
        user
        username
        reply
        createdAt
    }
}
`

export default ReplyForm