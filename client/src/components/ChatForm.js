import gql from 'graphql-tag'
import React, { useState } from 'react'
import { Button, Form } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'

import { FETCH_GROUP_CHAT_QUERY } from '../util/graphql'
import { useForm } from '../util/hooks'

const _ = require('lodash');

function ChatForm({keyword}){

    const [errors, setErrors] = useState({});

    const { values, onChange, onSubmit } = useForm(createChatCallback, {
        chat: '',
    })

    const [createChat] = useMutation(CREATE_CHAT_MUTATION, {
        variables: {...values, keyword},
        update(cache, result) {
            const data = _.cloneDeep(
                cache.readQuery({
                    query: FETCH_GROUP_CHAT_QUERY,
                    variables: {keyword: keyword}
                })
            )
            console.log(result.data.createChat)
            console.log(data.getGroupChat)
            data.getGroupChat = [...data.getGroupChat, result.data.createChat]
            console.log(data.getGroupChat)

            cache.writeQuery({
                query: FETCH_GROUP_CHAT_QUERY,
                data: {...data},
                variables: {keyword: keyword}
            });

            values.chat = ''
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

    function createChatCallback() {
        createChat()
    }

    return(
        <>
            <Form onSubmit={onSubmit}>
                <h2> Create chat: </h2>
                <Form.Field>
                    <Form.Input
                        placeholder='Chat...'
                        name='chat'
                        onChange={onChange}
                        value={values.chat}
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

const CREATE_CHAT_MUTATION = gql`
mutation createChat($keyword: String!, $chat: String!) {
    createChat(keyword: $keyword, chat: $chat) {
        id
        user
        username
        chat
        replies{
            id
            user
            username
            reply
            createdAt
        }
        createdAt
    }
}
`

export default ChatForm

// createChat(keyword: String!, chat: String!): Chat!