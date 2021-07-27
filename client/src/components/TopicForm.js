import gql from 'graphql-tag'
import React, { useState } from 'react'
import { Button, Form } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'

import { FETCH_USER_QUERY } from '../util/graphql'
import { useForm } from '../util/hooks'

const _ = require('lodash');

function TopicForm({ userId }) {

    const [errors, setErrors] = useState({});

    const { values, onChange, onSubmit } = useForm(createTopicCallback, {
        keyword: '',
    })

    console.log("TEST 0")

    const [createTopic] = useMutation(CREATE_TOPIC_MUTATION, {
        variables: values,
        update(cache, result) {
            const data = _.cloneDeep(
            cache.readQuery({
                query: FETCH_USER_QUERY,
                variables: {
                    userId
                }
            })
            )
            console.log("TESTER", result.data.createTopic)
            console.log(data.getUser.topics)
            console.log(data)
            data.getUser.topics = [...data.getUser.topics, result.data.createTopic]
            cache.writeQuery({
                query: FETCH_USER_QUERY,
                data: {...data},
                variables: { userId }
            });

            values.keyword = ''
            setErrors('')           
        },
        onError(err) {
            console.log(err)
            setErrors(err.graphQLErrors[0].extensions.exception.errors);
        },

        refetchQueries: [
            {
                query: FETCH_USER_QUERY
                ,
                variables: { userId}
            }
        ]
    })

    function createTopicCallback() {
        createTopic()
    }

    return (
    <>
        <Form onSubmit={onSubmit}>
            <h2> New topic: </h2>
            <Form.Field>
                <Form.Input
                    placeholder='Keyword...'
                    name='keyword'
                    onChange={onChange}
                    value={values.keyword}
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

const CREATE_TOPIC_MUTATION = gql`
mutation createTopic($keyword: String!) {
    createTopic(keyword: $keyword) {
        keyword
        chats {
            chat
        }
    }
}
`

export default TopicForm