import React, { useState, useContext } from 'react'
import { Button, Form } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'

import { AuthContext } from '../context/auth'
import { FETCH_USER_QUERY, CREATE_TOPIC_MUTATION } from '../util/graphql'
import { useForm } from '../util/hooks'

const _ = require('lodash');

function TopicForm() {

    const { user } = useContext(AuthContext);

    const [errors, setErrors] = useState({});

    const { values, onChange, onSubmit } = useForm(createTopicCallback, {
        keyword: '',
    })

    const [createTopic] = useMutation(CREATE_TOPIC_MUTATION, {
        variables: values,
        update(cache, result) {
            console.log("LOOOOOOOK")
            console.log(result)
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

            values.keyword = ''
            setErrors('')           
        },
        onError(err) {
            setErrors(err.graphQLErrors[0].extensions.errors);
        },

        refetchQueries: [
            {
                query: FETCH_USER_QUERY,
                variables: {userId: user.id}
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

export default TopicForm